import { useEffect, useRef, useState } from "react";

import * as S from "./styles";

import type { Scene3D } from "@/3d/Scene3D";
import type { Vector2 } from "@/apis/entities";
import {
    MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS,
    MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS,
    MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS,
} from "@/constant";
import { isSafari } from "@/utils/browserUtils";

type JoystickAxes = Vector2;
type Props = {
    scene3D: Scene3D;
};

const JOYSTICK_DATA: {
    joystickTouchId: number | null;
    // for keeping track of current touch on safari
    initialTouchPosition: JoystickAxes | null;
    innerJoystickPosition: JoystickAxes;
    wasRunning: boolean;
} = {
    joystickTouchId: null,
    initialTouchPosition: null,
    innerJoystickPosition: { x: 0, y: 0 },
    wasRunning: false,
};

export const MultiplayJoystick: React.FC<Props> = ({ scene3D }) => {
    const joystickRef = useRef<HTMLDivElement>(null);
    const joystickDotRef = useRef<HTMLDivElement>(null);
    const [isOnSafari] = useState<boolean>(isSafari());

    // is landscape mode if width is at least 1.5 times the height
    const isLandScape = window.innerWidth / window.innerHeight >= 1.3;

    useEffect(() => {
        const joystick = joystickRef.current;
        if (!joystick) return;

        const updateJoystickDot = (x: number, y: number) => {
            if (!joystickDotRef.current) return;
            joystickDotRef.current.style.left = `${S.INITIAL_JOYSTICK_POSITION + x
                }px`;
            joystickDotRef.current.style.bottom = `${S.INITIAL_JOYSTICK_POSITION + y
                }px`;
        };

        const controlAvatar3D = (x: number, y: number) => {
            scene3D.avatarController?.setJoystickAxes(x, y);

            // control avatar walking and running
            const threshold = 0.5;
            const avatar = scene3D.avatar;
            const avatarController = scene3D.avatarController;

            if (!avatar || !avatarController) return;

            const distance = Math.sqrt(x ** 2 + y ** 2);
            const isInRunningZone = distance > threshold;
            const isInsideExcludedSquare =
                Math.abs(x) < threshold && Math.abs(y) < threshold;

            if (isInRunningZone || !isInsideExcludedSquare) {
                if (!JOYSTICK_DATA.wasRunning) {
                    avatarController.run();
                    JOYSTICK_DATA.wasRunning = true;
                }
            } else if (JOYSTICK_DATA.wasRunning) {
                avatarController.walk();
                JOYSTICK_DATA.wasRunning = false;
            }
        };

        const onTouchStart = (event: TouchEvent) => {
            event.preventDefault();

            const target = event.target as HTMLDivElement;
            const rect = target.getBoundingClientRect();
            const touch = Array.from(event.touches).at(-1);

            if (
                !touch ||
                touch.clientX < rect.left ||
                touch.clientX > rect.right ||
                touch.clientY < rect.top ||
                touch.clientY > rect.bottom
            )
                return;

            JOYSTICK_DATA.joystickTouchId = touch.identifier;

            if (isOnSafari) {
                JOYSTICK_DATA.initialTouchPosition = {
                    x: touch.clientX,
                    y: touch.clientY,
                };
            }

            if ((touch.target as HTMLElement).className !== "css-18stpdj") {
                if (rect.width === MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS * 2) {
                    JOYSTICK_DATA.innerJoystickPosition.x = touch.clientX;
                    JOYSTICK_DATA.innerJoystickPosition.y = touch.clientY;
                } else {
                    const rectLeft = rect.left;
                    const rectTop = rect.top;
                    const touchClientX = touch.clientX * 1.25;
                    const touchClientY = touch.clientY * 1.04;
                    const additionalXPosition =
                        rectLeft + MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS - touchClientX;
                    const additionalYPosition =
                        rectTop + MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS - touchClientY;

                    updateJoystickDot(-additionalXPosition, additionalYPosition);
                    controlAvatar3D(
                        -additionalXPosition / MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS,
                        additionalYPosition / MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS
                    );
                }
            }
        };

        const onTouchMove = (event: TouchEvent) => {
            event.preventDefault();

            if (JOYSTICK_DATA.joystickTouchId === null) return;

            const touches = event.touches;
            let touch = Array.from(touches).find(
                (touch) => touch.identifier === JOYSTICK_DATA.joystickTouchId
            );

            if (JOYSTICK_DATA.initialTouchPosition) {
                let closestTouch = touches[0];
                let minDistance = Infinity;

                const { x: initialX, y: initialY } = JOYSTICK_DATA.initialTouchPosition;

                for (const touch of Array.from(touches)) {
                    const distance = Math.hypot(
                        touch.clientX - initialX,
                        touch.clientY - initialY
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestTouch = touch;
                    }
                }

                touch = closestTouch;
            }

            if (!touch) return;

            if ((touch.target as HTMLElement).className !== "css-18stpdj") {
                if (joystickRef.current === null) return;

                const rect = joystickRef.current.getBoundingClientRect();
                const rectLeft = rect.left;
                const rectTop = rect.top;

                // add offset to match the dot position to the touch position
                const touchClientX = touch.clientX + 28.8;
                const touchClientY = touch.clientY + 28.8;

                let additionalXPosition = 0;
                let additionalYPosition = 0;
                if (rect.width === MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS * 2) {
                    additionalXPosition =
                        JOYSTICK_DATA.innerJoystickPosition.x - touchClientX;
                    additionalYPosition =
                        JOYSTICK_DATA.innerJoystickPosition.y - touchClientY;
                } else {
                    additionalXPosition =
                        rectLeft + MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS - touchClientX;
                    additionalYPosition =
                        rectTop + MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS - touchClientY;
                }

                // limit the joystick dot position to the mid circle
                const radius = Math.sqrt(
                    Math.pow(additionalYPosition, 2) + Math.pow(additionalXPosition, 2)
                );
                if (radius > MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS) {
                    const angle = Math.atan2(additionalYPosition, additionalXPosition);
                    additionalXPosition =
                        MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS * Math.cos(angle);
                    additionalYPosition =
                        MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS * Math.sin(angle);
                }

                updateJoystickDot(-additionalXPosition, additionalYPosition);
                controlAvatar3D(
                    -additionalXPosition / MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS,
                    additionalYPosition / MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS
                );
            }
        };

        const onTouchEnd = () => {
            updateJoystickDot(0, 0);
            controlAvatar3D(0, 0);
            JOYSTICK_DATA.joystickTouchId = null;
            JOYSTICK_DATA.initialTouchPosition = null;
            JOYSTICK_DATA.innerJoystickPosition.x = 0;
            JOYSTICK_DATA.innerJoystickPosition.y = 0;
        };

        joystick.addEventListener("touchstart", onTouchStart, { passive: false });
        joystick.addEventListener("touchmove", onTouchMove, { passive: false });
        joystick.addEventListener("touchend", onTouchEnd, { passive: false });

        return () => {
            joystick.removeEventListener("touchstart", onTouchStart);
            joystick.removeEventListener("touchmove", onTouchMove);
            joystick.removeEventListener("touchend", onTouchEnd);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <S.JoystickSection
            id="mobileMultiplayerJoystick"
            className="mobile-multiplayer-joystick"
            isLandScape={isLandScape}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <S.JoystickOuterCircle ref={joystickRef}>
                <S.JoyStickCircle
                    ref={joystickDotRef}
                    id="mobileMultiplayerJoystickDot"
                />
            </S.JoystickOuterCircle>
        </S.JoystickSection>
    );
};
