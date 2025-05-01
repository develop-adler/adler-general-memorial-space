// import { Animation } from '@babylonjs/core/Animations/animation';
// import { Ray } from '@babylonjs/core/Culling/ray';
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
// import { Axis } from '@babylonjs/core/Maths/math.axis';
import {
    Quaternion,
    Vector2 as BJSVector2,
    Vector3,
} from "@babylonjs/core/Maths/math.vector";
// import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ProximityCastResult } from "@babylonjs/core/Physics/proximityCastResult";
import { ShapeCastResult } from "@babylonjs/core/Physics/shapeCastResult";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShapeCylinder } from "@babylonjs/core/Physics/v2/physicsShape";

import type { Vector2 } from "@/apis/entities";
import type { AvatarType } from "@/3d/Avatar/Avatar";
import {
    AVATAR_CONTROLLER_PARAMS,
    AVATAR_INTERACTIONS,
    AVATAR_PARAMS,
    PHYSICS_SHAPE_FILTER_GROUPS,
} from "@/constant";
import eventBus from "@/eventBus";
import { isMobile } from "@/utils/browserUtils";
import { lerp } from "@/utils/functionUtils";

import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
// import type { PointerInfo } from '@babylonjs/core/Events/pointerEvents';
// import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import type { WebXRCamera } from "@babylonjs/core/XR/webXRCamera";

type JoystickAxes = Vector2;

interface KeyStatus {
    KeyW: boolean;
    ArrowUp: boolean;
    KeyA: boolean;
    ArrowLeft: boolean;
    KeyS: boolean;
    ArrowRight: boolean;
    KeyD: boolean;
    ArrowDown: boolean;
    Space: boolean;
}

const isArcRotateCameraMoved = (camera: ArcRotateCamera): boolean => {
    return !(
        camera.inertialAlphaOffset === 0 &&
        camera.inertialBetaOffset === 0 &&
        camera.inertialPanningX === 0 &&
        camera.inertialPanningY === 0
    );
};

const normalizeToMaxOne = (x: number, y: number) => {
    const maxAbs = Math.max(Math.abs(x), Math.abs(y));
    if (maxAbs === 0) return { x: 0, y: 0 }; // Avoid division by zero
    const scale = 1 / maxAbs;
    return { x: x * scale, y: y * scale };
};

const getSlerpValue = (valueToSet: number, capMin: number, capMax: number) => {
    return Math.min(capMax, Math.max(capMin, valueToSet));
};

// const clamp = (num: number, min: number, max: number) => {
//     return Math.max(min, Math.min(num, max));
// };

// const degreesToRadians = (degrees: number): number => {
//     return degrees * (Math.PI / 180);
// };

export class AvatarController {
    readonly scene: Scene;
    readonly camera: ArcRotateCamera;
    readonly avatar: AvatarType;
    readonly customHeadNode: TransformNode;

    private readonly _joystickAxes: JoystickAxes;
    private _isActive: boolean = false;

    private _refreshBoundingInfoObserver: Nullable<Observer<Scene>> = null;
    private _controllerObservers: Array<Observer<Scene> | Observer<Camera>> = [];
    // private _useControlCameraObserver: Nullable<Observer<PointerInfo>> = null;
    private _hitWall: boolean = false;
    private _cameraShortened: boolean = false;
    // private _isCameraControlledByUser: boolean = false;

    // ENTERING_XR = 0, EXITING_XR = 1, IN_XR = 2, NOT_IN_XR = 3
    private _xrState: 0 | 1 | 2 | 3 = 3;
    private _xrCamera: Nullable<WebXRCamera> = null;

    private _isCameraOffset: boolean = false;
    // private _isCameraModeTransitioning: boolean = false;
    private _cameraBodyObserver: Nullable<Observer<Scene>> = null;

    readonly movementKeys: KeyStatus = {
        KeyW: false,
        ArrowUp: false,
        KeyA: false,
        ArrowLeft: false,
        KeyS: false,
        ArrowRight: false,
        KeyD: false,
        ArrowDown: false,
        Space: false,
    };

    readonly oldCameraPosition: Vector3 = Vector3.Zero();
    readonly moveDirection: Vector3 = Vector3.Zero();
    readonly frontVector: Vector3 = Vector3.Zero();
    readonly sideVector: Vector3 = Vector3.Zero();

    private _moveSpeed: number = AvatarController.WALK_SPEED;

    readonly keyboardPressObserver: Observer<KeyboardInfo>;

    private _isJumping: boolean = false;
    readonly _coyoteTime: number = 0.2;
    readonly _jumpBufferTime: number = 0.2;
    private _coyoteTimeCounter: number = 0;
    private _jumpBufferCounter: number = 0;
    private _jumpingCooldownTimer: Nullable<NodeJS.Timeout> = null;

    // private _stairHeightHitSphere: Nullable<Mesh> = null;
    // private _stairDepthHitSphere: Nullable<Mesh> = null;
    private readonly _stairHeightLocalProximityResult: ProximityCastResult =
        new ProximityCastResult();
    private readonly _stairHeightHitWorldProximityResult: ProximityCastResult =
        new ProximityCastResult();
    private readonly _stairHeightCheckPhysicsShape: PhysicsShapeCylinder;
    private readonly _stairDepthLocalShapeCastResult: ShapeCastResult =
        new ShapeCastResult();
    private readonly _stairDepthHitWorldShapeCastResult: ShapeCastResult =
        new ShapeCastResult();

    private _dontZoomOut: boolean = false;

    static readonly CROUCH_SPEED: number = 1.6;
    static readonly WALK_SPEED: number = 3;
    static readonly RUN_SPEED: number = 6.5;
    static readonly JUMP_FORCE: number = 12;
    static readonly FOV_FIRSTPERSON_MOBILE: number = 1.4;
    static readonly FOV_FIRSTPERSON: number = 1;
    static readonly FOV_THIRDPERSON_MOBILE: number = 1.2;
    static readonly FOV_THIRDPERSON: number = 0.8;
    static readonly JOYSTICK_DEADZONE: number = 0.07;

    constructor(
        avatar: AvatarType,
        camera: ArcRotateCamera,
        scene: Scene,
        joystickAxes?: JoystickAxes
    ) {
        this.avatar = avatar;
        this.camera = camera;
        this.scene = scene;
        this._joystickAxes = joystickAxes ?? { x: 0, y: 0 };
        this.customHeadNode = new TransformNode("customHeadNode", scene, true);
        this.customHeadNode.parent = this.avatar.root;
        this.customHeadNode.position.y += this.avatar.headHeight;

        this._stairHeightCheckPhysicsShape = new PhysicsShapeCylinder(
            new Vector3(0, 0.125, 0),
            new Vector3(0, 0.45, 0),
            AVATAR_PARAMS.CAPSULE_RADIUS * 1.125,
            scene
        );
        this._stairHeightCheckPhysicsShape.material = {
            friction: 0,
            restitution: 0,
        };
        this._stairHeightCheckPhysicsShape.filterMembershipMask =
            PHYSICS_SHAPE_FILTER_GROUPS.NONE;
        this._stairHeightCheckPhysicsShape.filterCollideMask =
            PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT;

        this._moveSpeed *= this.avatar.gender === "female" ? 0.75 : 1;

        // Enable keyboard control
        this.keyboardPressObserver = this._createKeyboardObserver();
    }

    start(): void {
        if (this._isActive) return;
        if (this._controllerObservers.length > 0) {
            this._controllerObservers.forEach((observer) => observer.remove());
            this._controllerObservers = [];
        }

        this._controllerObservers.push(
            this.scene.onBeforeCameraRenderObservable.add(() => {
                this._updateCamera();
            })
        );

        this._controllerObservers.push(
            this.scene.onBeforeRenderObservable.add(() => {
                this._updateCharacter();
                this._updateCharacterAnimation();
                this._updateCharacterHead();

                Object.values(this.avatar.animations).forEach((anim) => {
                    // fix blending speed
                    anim.blendingSpeed = getSlerpValue(
                        this.scene.getAnimationRatio() * 0.5,
                        0.05,
                        0.15
                    );
                });
            })
        );

        this.avatar.scene.getEngine().getRenderingCanvas()!.onblur = () => {
            this.stopAllMovements();
        };

        // offset so that avatar stays on the left side of the screen
        if (!isMobile()) {
            this._isCameraOffset = true;
            this.camera.targetScreenOffset = new BJSVector2(-0.45, 0);
        }

        // make camera follow avatar and target head
        this.camera.targetHost = this.customHeadNode;

        // update bounding info before every render but with reduced frequency
        // (even though it uses GPU it can be expensive on lower end devices)
        // const interval = 1000 / 15;
        // let lastTime = performance.now();
        // this._refreshBoundingInfoObserver = this.scene.onBeforeRenderObservable.add(() => {
        //     const currentTime = performance.now();
        //     const deltaTime = currentTime - lastTime;
        //     if (deltaTime <= interval) return;
        //     lastTime = currentTime - (deltaTime % interval);

        //     if (this.avatar.rootMesh) {
        //         this.avatar.adlerEngine.engineCore.bbHelper.computeAsync(
        //             this.avatar.otherAvatars.map(avatar => avatar.meshes).flat()
        //         );
        //     }
        // });
        this._isActive = true;
    }

    stop(): void {
        this._cameraBodyObserver?.remove();
        this._cameraBodyObserver = null;
        this._refreshBoundingInfoObserver?.remove();
        this._refreshBoundingInfoObserver = null;
        // this._useControlCameraObserver?.remove();
        this._controllerObservers.forEach((observer) => observer.remove());
        this._controllerObservers = [];

        // remove camera locked target
        this.camera.targetHost = null;

        // remove camera target offset
        this._isCameraOffset = false;
        this.camera.targetScreenOffset = BJSVector2.ZeroReadOnly;

        this._isActive = false;
    }

    cancelCharacterInteraction(): void {
        if (!this.avatar.interaction) return;
        if (this.avatar.interaction.type === "gethit") return;

        // play the x-to-idle animation for continuous interactions
        // like sit interaction
        if (this.avatar.interaction.type === "continuous") {
            this.avatar.interaction.endContinuousInteraction(() => {
                this.avatar.interaction?.dispose();
                this.avatar.interaction = null;
            });
            return;
        }

        this.avatar.interaction.dispose();
        this.avatar.interaction = null;
    }

    private _createKeyboardObserver(): Observer<KeyboardInfo> {
        return this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN: {
                    const key = kbInfo.event.code;
                    if (key in this.movementKeys) {
                        this.movementKeys[key as keyof KeyStatus] = true;
                        this.cancelCharacterInteraction();
                    }

                    switch (key) {
                        case "Escape":
                            this.cancelCharacterInteraction();
                            break;
                        case "ShiftLeft":
                            this.run();
                            break;
                    }

                    if (
                        !this.avatar.isMoving &&
                        this.avatar.isGrounded &&
                        !this.avatar.interaction
                    ) {
                        switch (key) {
                            case "Digit1":
                                this.avatar.playInteraction(
                                    "Wave",
                                    AVATAR_INTERACTIONS["Wave"]
                                );
                                break;
                            case "Digit2":
                                this.avatar.playInteraction("Bow", AVATAR_INTERACTIONS["Bow"]);
                                break;
                            case "Digit3":
                                this.avatar.playInteraction(
                                    "Clap",
                                    AVATAR_INTERACTIONS["Clap"]
                                );
                                break;
                            case "Digit4":
                                this.avatar.playInteraction("Cry", AVATAR_INTERACTIONS["Cry"]);
                                break;
                            case "Digit5":
                                this.avatar.playInteraction(
                                    "HipHopDance",
                                    AVATAR_INTERACTIONS["HipHopDance"]
                                );
                                break;
                            case "Digit6":
                                this.avatar.playInteraction(
                                    "Kick",
                                    AVATAR_INTERACTIONS["Kick"]
                                );
                                break;
                            case "Digit7":
                                this.avatar.playInteraction(
                                    "Punch",
                                    AVATAR_INTERACTIONS["Punch"]
                                );
                                break;
                            case "Digit8":
                                this.avatar.playInteraction("Sit", AVATAR_INTERACTIONS["Sit"]);
                                break;
                        }
                    }
                    break;
                }
                case KeyboardEventTypes.KEYUP: {
                    const key = kbInfo.event.code;
                    if (key in this.movementKeys) {
                        this.movementKeys[key as keyof KeyStatus] = false;
                    }
                    if (key === "ShiftLeft") this.walk();
                    break;
                }
            }
        });
    }

    private _updateCharacterAnimation(): void {
        if (this.avatar.interaction !== null) return;

        const animPrefix = this.avatar.gender === "male" ? "Male" : "Female";

        // play jump animation if not on ground
        if (!this.avatar.isGrounded) {
            this.avatar.playAnimation(animPrefix + "Jump");
            return;
        }

        // play correct movement animation based on velocity
        if (this.avatar.capsuleBody) {
            const velocity = this.avatar.capsuleBody.getLinearVelocity();

            if (Math.abs(velocity.x) <= 0.02 && Math.abs(velocity.z) <= 0.02) {
                if (this.avatar.isCrouching) {
                    this.avatar.playAnimation(animPrefix + "Crouch");
                    return;
                }

                this.avatar.playAnimation(animPrefix + "Idle");
                return;
            }

            if (this.avatar.isCrouching) {
                this.avatar.playAnimation(animPrefix + "CrouchWalk");
                return;
            } else if (this.avatar.isRunning) {
                this.avatar.playAnimation(animPrefix + "Run");
                return;
            } else {
                this.avatar.playAnimation(animPrefix + "Walk");
                return;
            }
        }

        // play idle animation by default
        this.avatar.playAnimation(animPrefix + "Idle");
    }

    /**
     * Update camera position and target every frame to make it over-the-shoulder style
     */
    private _updateCamera(): void {
        if (!this._isActive) return;

        if (this._isCameraOffset) {
            // offset based on camera radius using linear interp
            // the lower the radius, the less the offset
            const offset = lerp(
                -0.15,
                -0.475,
                this.camera.radius / AVATAR_PARAMS.CAMERA_RADIUS_UPPER_AVATAR
            );
            this.camera.targetScreenOffset = new BJSVector2(offset, 0);
        }

        this._updateRaycaster();
        // this._controlCameraMode();
        this._smoothlyControlCameraDistance();
    }

    private _updateCharacter(): void {
        if (!this._isActive || !this.avatar.capsuleBody) return;

        // prevent movement when continuous interaction is playing
        if (this.avatar.interaction?.type === "continuous") return;

        // sync avatar rotation with camera rotation in first person mode
        if (this._xrCamera) {
            const cameraToUse = this._xrCamera ? this._xrCamera : this.camera;

            const cameraRotation = cameraToUse.absoluteRotation;

            // Convert the quaternion to Euler angles
            const cameraEuler = cameraRotation.toEulerAngles();

            // Create a new quaternion that only includes the Y-axis (yaw) rotation
            const targetQuaternion = Quaternion.RotationYawPitchRoll(
                cameraEuler.y,
                0,
                0
            );

            // Smoothly interpolate between the avatar's current rotation and the target yaw rotation
            const currentRotation =
                this.avatar.root.rotationQuaternion || Quaternion.Identity();

            const ray = cameraToUse.getForwardRay(0.1);
            const forwardTarget = ray.origin.add(ray.direction.scale(10));
            const forward = this.avatar.root.forward.normalize();
            const toTarget = forwardTarget
                .subtract(this.avatar.root.position)
                .normalize();
            const dot = Vector3.Dot(forward, toTarget);

            // only rotate avatar when head is turned to the shoulder
            // and continue turning towards shoulder
            if (dot <= 0.25) {
                this.avatar.root.rotationQuaternion = Quaternion.Slerp(
                    currentRotation,
                    targetQuaternion,
                    getSlerpValue(1 / this.scene.getAnimationRatio(), 0.05, 0.2)
                );
            }
        }

        // when joystick is moved
        if (
            Math.abs(this._joystickAxes.x) > AvatarController.JOYSTICK_DEADZONE ||
            Math.abs(this._joystickAxes.y) > AvatarController.JOYSTICK_DEADZONE
        ) {
            this.cancelCharacterInteraction();

            this.avatar.isMoving = true;

            // ENTERING_XR = 0, EXITING_XR = 1, IN_XR = 2, NOT_IN_XR = 3
            if (this._xrState === 1 || this._xrState === 3) {
                // calculate the rotation angle based on joystick's x and y
                const joystickAngle = Math.atan2(
                    -this._joystickAxes.x,
                    -this._joystickAxes.y
                );

                // calculate towards camera direction
                const angleYCameraDirection = Math.atan2(
                    this.camera.position.x - this.avatar.root.position.x,
                    this.camera.position.z - this.avatar.root.position.z
                );

                // rotate mesh with respect to camera direction with lerp
                this.avatar.root.rotationQuaternion ??= Quaternion.Identity();
                this.avatar.root.rotationQuaternion = Quaternion.Slerp(
                    this.avatar.root.rotationQuaternion,
                    Quaternion.RotationAxis(
                        Vector3.Up(),
                        angleYCameraDirection + joystickAngle
                    ),
                    getSlerpValue(1 / this.scene.getAnimationRatio(), 0.05, 0.2)
                );
            }

            // ========================================================
            // move physics body

            // normalize to 1 for joystic x and y for controlled movement speed
            const { x, y } = normalizeToMaxOne(
                this._joystickAxes.x,
                this._joystickAxes.y
            );
            this.moveDirection.set(x, 0, y);
            this.moveDirection.scaleInPlace(this._moveSpeed);

            // Convert the quaternion to Euler angles
            const cameraEuler = this.camera.absoluteRotation.toEulerAngles();

            // Create a new quaternion that only includes the Y-axis (yaw) rotation
            const targetQuaternion = Quaternion.RotationYawPitchRoll(
                cameraEuler.y,
                0,
                0
            );

            // move relative to camera's rotation
            if (this._xrState === 1 || this._xrState === 3) {
                this.moveDirection.rotateByQuaternionToRef(
                    targetQuaternion,
                    this.moveDirection
                );
            } else if (this._xrCamera) {
                this.moveDirection.rotateByQuaternionToRef(
                    this._xrCamera.absoluteRotation,
                    this.moveDirection
                );
            }

            // get y velocity to make it behave properly
            const vel = this.avatar.capsuleBody.getLinearVelocity();
            this.moveDirection.y = vel.y;

            // move
            this.avatar.capsuleBody.setLinearVelocity(this.moveDirection);
        } else {
            // slows down the avatar when not moving
            const velocity = this.avatar.capsuleBody.getLinearVelocity();
            let drag = 0.85;
            // apply less drag in the air
            if (!this.avatar.isGrounded) drag = 0.95;
            this.avatar.capsuleBody.setLinearVelocity(
                new Vector3(velocity.x * drag, velocity.y, velocity.z * drag)
            );

            this.avatar.isMoving = false;
        }

        // keyboard controls
        const forward =
            !!this.movementKeys["KeyW"] || !!this.movementKeys["ArrowUp"];
        const backward =
            !!this.movementKeys["KeyS"] || !!this.movementKeys["ArrowDown"];
        const left =
            !!this.movementKeys["KeyA"] || !!this.movementKeys["ArrowLeft"];
        const right =
            !!this.movementKeys["KeyD"] || !!this.movementKeys["ArrowRight"];

        if (forward || backward || left || right) {
            this.avatar.isMoving = true;

            this.frontVector.set(0, 0, Number(forward) - Number(backward));
            this.sideVector.set(Number(left) - Number(right), 0, 0);

            this.moveDirection.set(
                this.frontVector.x - this.sideVector.x,
                0,
                this.frontVector.z - this.sideVector.z
            );
            this.moveDirection.normalize();
            this.moveDirection.scaleInPlace(this._moveSpeed);

            // Convert the quaternion to Euler angles
            const cameraEuler = this.camera.absoluteRotation.toEulerAngles();

            // Create a new quaternion that only includes the Y-axis (yaw) rotation
            const targetQuaternion = Quaternion.RotationYawPitchRoll(
                cameraEuler.y,
                0,
                0
            );

            // move relative to camera's rotation
            if (this._xrState === 1 || this._xrState === 3) {
                this.moveDirection.rotateByQuaternionToRef(
                    targetQuaternion,
                    this.moveDirection
                );
            } else if (this._xrCamera) {
                this.moveDirection.rotateByQuaternionToRef(
                    this._xrCamera.absoluteRotation,
                    this.moveDirection
                );
            }

            // move the mesh by moving the physics body
            const vel = this.avatar.capsuleBody.getLinearVelocity();
            this.moveDirection.y = vel.y;

            // TODO: don't allow velocity acceleration in the air

            this.avatar.capsuleBody.setLinearVelocity(this.moveDirection);

            // calculate towards camera direction
            const angleYCameraDirection = Math.atan2(
                this.camera.position.x - this.avatar.root.position.x,
                this.camera.position.z - this.avatar.root.position.z
            );
            // get direction offset
            const directionOffset = this._calculateDirectionOffset();

            // rotate mesh with respect to camera direction with lerp
            this.avatar.root.rotationQuaternion ??= Quaternion.Identity();
            this.avatar.root.rotationQuaternion = Quaternion.Slerp(
                this.avatar.root.rotationQuaternion,
                Quaternion.RotationAxis(
                    Vector3.Up(),
                    angleYCameraDirection + directionOffset
                ),
                getSlerpValue(1 / this.scene.getAnimationRatio(), 0.05, 0.2)
            );
        } else {
            // slows down the avatar when not moving
            const velocity = this.avatar.capsuleBody.getLinearVelocity();
            let drag = 0.85;
            // apply less drag in the air
            if (!this.avatar.isGrounded) drag = 0.95;
            this.avatar.capsuleBody.setLinearVelocity(
                new Vector3(velocity.x * drag, velocity.y, velocity.z * drag)
            );

            this.avatar.isMoving = false;
        }

        const velocity = this.avatar.capsuleBody.getLinearVelocity();
        if (velocity.y < -3) {
            this.avatar.isFalling = true;
        } else {
            this.avatar.isFalling = false;
        }

        this._handleJumping(this.avatar.capsuleBody);
        this._handleStairs();
    }

    private _handleJumping(capsuleBody: PhysicsBody): void {
        // const checkIsGrounded = this._isGrounded(ray);
        // if (!this.avatar.isGrounded && checkIsGrounded) {
        //     this.onLandingObservable.notifyObservers();
        // }
        // this.avatar.isGrounded = checkIsGrounded;

        if (this.avatar.isGrounded) {
            this._coyoteTimeCounter = this._coyoteTime;
        } else {
            this._coyoteTimeCounter -= this.scene.getEngine().getDeltaTime() / 1000;
        }

        if (this.movementKeys["Space"] === true) {
            this._jumpBufferCounter = this._jumpBufferTime;
        } else {
            this._jumpBufferCounter -= this.scene.getEngine().getDeltaTime() / 1000;
        }

        const velocity = capsuleBody.getLinearVelocity();

        // jump lower when user is tapping jump button
        if (
            this._coyoteTimeCounter > 0 &&
            this._jumpBufferCounter > 0 &&
            this.avatar.isGrounded &&
            !this._isJumping
        ) {
            // force cancel interaction
            this.cancelCharacterInteraction();

            const velocity = capsuleBody.getLinearVelocity();
            capsuleBody.setLinearVelocity(
                new Vector3(velocity.x, AvatarController.JUMP_FORCE, velocity.z)
            );

            this._jumpBufferCounter = 0;

            this._isJumping = true;
            // this.avatar.isGrounded = false;
            if (this.avatar.isCrouching) this.setCrouch(false);

            if (this._jumpingCooldownTimer) clearTimeout(this._jumpingCooldownTimer);
            this._jumpingCooldownTimer = setTimeout(() => {
                this._isJumping = false;
            }, 300);

            eventBus.once(`avatar:landing`, () => {
                if (!this.avatar.isRunning) {
                    this._moveSpeed = AvatarController.WALK_SPEED;
                }
            });
        }

        // if button is not released, jump higher when user is holding jump button for longer time
        if (this.movementKeys["Space"] === false && velocity.y > 0) {
            capsuleBody.setLinearVelocity(
                new Vector3(velocity.x, velocity.y * 0.5, velocity.z)
            );
            this._coyoteTimeCounter = 0;
        }
        // ========================================================
    }

    private _handleStairs(): void {
        if (!this.avatar.isGrounded) return;

        const physicsEngine = this.scene.getPhysicsEngine();
        if (!physicsEngine) return;

        const hk = physicsEngine?.getPhysicsPlugin() as
            | HavokPlugin
            | null
            | undefined;
        if (!hk) return;

        this._stairHeightLocalProximityResult.reset();
        this._stairHeightHitWorldProximityResult.reset();
        this._stairDepthLocalShapeCastResult.reset();
        this._stairDepthHitWorldShapeCastResult.reset();

        hk.shapeProximity(
            {
                shape: this._stairHeightCheckPhysicsShape,
                position: this.avatar.root.absolutePosition,
                rotation: this.avatar.root.absoluteRotationQuaternion,
                maxDistance: 0,
                shouldHitTriggers: false,
                ignoreBody: this.avatar.capsuleBody ?? undefined,
            },
            this._stairHeightLocalProximityResult,
            this._stairHeightHitWorldProximityResult
        );

        if (
            !this._stairHeightLocalProximityResult.hasHit ||
            !this._stairHeightHitWorldProximityResult.body
        )
            return;

        // get offset from the hit point to teleport the avatar
        const heightHitPoint = this._stairHeightHitWorldProximityResult.hitPoint;
        const avatarPosition = this.avatar.getPosition(true);
        const heightHitPointOffset = heightHitPoint.subtract(avatarPosition);

        // if offset z is not within same direction of move direction, return
        if (Vector3.Dot(heightHitPointOffset, this.moveDirection) < 0.45) return;

        // for debugging
        // if (!this._stairHeightHitSphere) {
        //     this._stairHeightHitSphere = CreateSphere(
        //         'heightHitSphere',
        //         { diameter: 0.05, segments: 8 },
        //         this.scene
        //     );
        //     this._stairHeightHitSphere.setAbsolutePosition(heightHitPoint);
        // } else {
        //     this._stairHeightHitSphere
        //         .createInstance('hitSphere_' + this.scene.meshes.length)
        //         .setAbsolutePosition(heightHitPoint);
        // }

        // endposition is the from hit point to direction of movement
        const endPosition = heightHitPoint.add(this.moveDirection.normalize());

        hk.shapeCast(
            {
                shape: this._stairHeightCheckPhysicsShape,
                startPosition: heightHitPoint,
                endPosition: endPosition,
                rotation: this.avatar.root.absoluteRotationQuaternion,
                shouldHitTriggers: false,
                ignoreBody: this.avatar.capsuleBody ?? undefined,
            },
            this._stairDepthLocalShapeCastResult,
            this._stairDepthHitWorldShapeCastResult
        );

        // no hit point, meaning it's either the top of the stair or not a stair, teleport anyways
        if (
            !this._stairDepthLocalShapeCastResult.hasHit ||
            !this._stairDepthHitWorldShapeCastResult.body
        ) {
            // teleport avatar up to stair step height
            this.avatar.setPosition(
                new Vector3(avatarPosition.x, heightHitPoint.y, avatarPosition.z)
            );
            return;
        }

        const hitPoint = this._stairDepthHitWorldShapeCastResult.hitPoint;
        const depthOffset = hitPoint.subtract(heightHitPoint);

        // if stair step isn't deep enough, return
        if (Math.abs(depthOffset.z) < AVATAR_CONTROLLER_PARAMS.STAIR_STEP_MIN_DEPTH)
            return;

        // check if stair step is too high to prevent walking up very steep surfaces
        if (
            depthOffset.y - heightHitPoint.y >
            AVATAR_CONTROLLER_PARAMS.STAIR_STEP_MAX_HEIGHT
        )
            return;

        // for debugging
        // if (!this._stairDepthHitSphere) {
        //     this._stairDepthHitSphere = CreateSphere(
        //         'depthHitSphere',
        //         { diameter: 0.05, segments: 8 },
        //         this.scene
        //     );
        //     this._stairDepthHitSphere.material = this.scene.getMaterialByName('defaultMaterial');
        //     this._stairDepthHitSphere.setAbsolutePosition(
        //         this._stairDepthHitWorldShapeCastResult.hitPoint
        //     );
        // } else {
        //     this._stairDepthHitSphere
        //         .createInstance('hitSphere_' + this.scene.meshes.length)
        //         .setAbsolutePosition(this._stairDepthHitWorldShapeCastResult.hitPoint);
        // }

        // teleport avatar up to stair step height
        this.avatar.setPosition(
            new Vector3(
                avatarPosition.x,
                avatarPosition.y + depthOffset.y,
                avatarPosition.z
            )
        );

        // // shoot ray down to snap avatar down step instead of floating when doing down stairs
        // const ray = new Ray(
        //     this.avatar.root.getAbsolutePosition(),
        //     Vector3.Down(),
        //     AvatarController.STAIR_STEP_MAX_HEIGHT
        // );
        // // cast ray down to check the next stair step when going down
        // const raycastResult = physicsEngine.raycast(ray.origin, ray.direction, {
        //     membership: PHYSICS_SHAPE_FILTER_GROUPS.NONE,
        //     collideWith: PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT,
        // });
        // if (!raycastResult.hasHit) return;

        // const downHitWorld = raycastResult.hitPointWorld;

        // if (Math.abs(downHitWorld.y - avatarPosition.y) >= AvatarController.STAIR_DOWN_MAX_HEIGHT)
        //     return;

        // console.log('raycastResult.hitPointWorld', raycastResult.hitPointWorld);

        // this.avatar.setPosition(
        //     new Vector3(avatarPosition.x, raycastResult.hitPointWorld.y, avatarPosition.z)
        // );
    }

    /**
     * Make avatar head look at where the camera is looking
     */
    private _updateCharacterHead(): void {
        if (!this._isActive || !this.avatar.boneLookController) {
            this.avatar.currentBoneLookControllerTarget = null;
            return;
        }

        const cameraToUse = this._xrCamera ? this._xrCamera : this.camera;
        // target is the point on the other side of the camera compare to the camera target
        const target = cameraToUse.globalPosition.add(
            this.customHeadNode.absolutePosition
                .subtract(cameraToUse.globalPosition)
                .normalize()
                .scale(100)
        );

        // this is here instead of within update() function because
        // other avatars don't need to have this updated every frame
        this.avatar.handleHeadRotationForAnimations();

        // if target is behind avatar's back, don't update head rotation
        // calculated using dot product
        const forward = this.avatar.root.forward.normalize();
        const toTarget = target.subtract(this.avatar.root.position).normalize();
        const dot = Vector3.Dot(forward, toTarget);
        if (dot >= 0.2) {
            this.avatar.update(target);
        } else {
            this.avatar.currentBoneLookControllerTarget = null;
        }
    }

    // this prevents camera from clipping through walls
    private _updateRaycaster() {
        if (this._xrCamera !== null) return;

        const physicsEngine = this.scene.getPhysicsEngine();
        if (!physicsEngine) return;

        const checkCollision = (result: PhysicsRaycastResult): boolean => {
            if (!result.hasHit || !result.body) {
                this._hitWall = false;
                return false;
            }

            this._hitWall = true;

            // prevent clipping through objects
            this.camera.radius = lerp(
                this.camera.radius,
                Vector3.Distance(
                    result.hitPointWorld,
                    this.customHeadNode.absolutePosition
                ) - 0.03,
                0.5
            );
            this._cameraShortened = true;

            return true;
        };

        const raycastResult = physicsEngine.raycast(
            this.customHeadNode.absolutePosition,
            this.camera.globalPosition,
            {
                collideWith:
                    PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT |
                    PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF,
            }
        );

        // if is avatar body, widen to not clip through avatar body
        if (
            raycastResult.body !== this.avatar.capsuleBody &&
            raycastResult.body?.transformNode?.name.includes("avatar")
        ) {
            // if hit point distance is within 0.6 of the camera radius, widen the radius
            const hitPoint = raycastResult.hitPointWorld;
            const distanceToHead = Vector3.Distance(
                hitPoint,
                this.customHeadNode.absolutePosition
            );
            const avatarOtherSide =
                distanceToHead + AVATAR_PARAMS.CAPSULE_RADIUS * 2.25;

            // check if other side of avatar has collision
            const raycastResult2 = physicsEngine.raycast(
                this.customHeadNode.absolutePosition,
                this.camera.globalPosition,
                {
                    collideWith: PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT,
                }
            );

            if (checkCollision(raycastResult2)) return;

            if (
                this.camera.radius >= distanceToHead &&
                this.camera.radius <= avatarOtherSide
            ) {
                // widen the camera radius to prevent clipping through avatar body
                const fixedRadius = lerp(
                    this.camera.radius,
                    avatarOtherSide + 0.1,
                    0.3
                );
                this.camera.radius = fixedRadius;
            }
            this._hitWall = false;
            return;
        }

        checkCollision(raycastResult);
    }

    /**
     * To be used within a render function, move camera away until
     * it reaches the half of upper limit of the avatar's radius
     */
    private _smoothlyControlCameraDistance(): void {
        if (isArcRotateCameraMoved(this.camera)) {
            this._dontZoomOut = false;
        }

        if (!this._cameraShortened || this._hitWall || this._dontZoomOut) return;

        // if is widen to correct radius or manually zoomed in, do nothing
        if (
            this.camera.radius >= AVATAR_PARAMS.CAMERA_RADIUS_UPPER_AVATAR * 0.7 ||
            this.camera.inertialRadiusOffset !== 0
        ) {
            this._cameraShortened = false;
            return;
        }

        // check if there's anything blocking the camera
        const physicsEngine = this.scene.getPhysicsEngine();
        if (!physicsEngine) {
            this.camera.radius += 0.014;
            return;
        }

        const raycastResult = physicsEngine.raycast(
            this.camera.globalPosition,
            this.camera.globalPosition.subtract(
                this.camera.getForwardRay(0.1).direction.normalize()
            ),
            {
                collideWith: PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT,
            }
        );

        if (raycastResult.hasHit) {
            this._dontZoomOut = true;
            return;
        }

        this.camera.radius += 0.014;
    }

    private _calculateDirectionOffset(): number {
        let directionOffset = 0;

        switch (true) {
            case this.movementKeys["KeyW"] || this.movementKeys["ArrowUp"]:
                switch (true) {
                    case this.movementKeys["KeyD"] || this.movementKeys["ArrowRight"]:
                        directionOffset = -Math.PI * 0.25 - Math.PI * 0.5;
                        break;
                    case this.movementKeys["KeyA"] || this.movementKeys["ArrowLeft"]:
                        directionOffset = Math.PI * 0.25 + Math.PI * 0.5;
                        break;
                    default:
                        directionOffset = Math.PI;
                        break;
                }
                break;
            case this.movementKeys["KeyS"] || this.movementKeys["ArrowDown"]:
                switch (true) {
                    case this.movementKeys["KeyD"] || this.movementKeys["ArrowRight"]:
                        directionOffset = -Math.PI * 0.25;
                        break;
                    case this.movementKeys["KeyA"] || this.movementKeys["ArrowLeft"]:
                        directionOffset = Math.PI * 0.25;
                        break;
                }
                break;
            case this.movementKeys["KeyD"] || this.movementKeys["ArrowRight"]:
                directionOffset = -Math.PI * 0.5;
                break;
            case this.movementKeys["KeyA"] || this.movementKeys["ArrowLeft"]:
                directionOffset = Math.PI * 0.5;
                break;
        }

        return directionOffset;
    }

    // /**
    //  * Casts a short ray towards the bottom to check if avatar is grounded
    //  * @returns true if ray hits any mesh in the scene
    //  */
    // private _isGrounded(): boolean {
    //     const ray = new Ray(
    //         new Vector3(
    //             this.avatar.root.getAbsolutePosition().x,
    //             this.avatar.root.getAbsolutePosition().y + 0.1,
    //             this.avatar.root.getAbsolutePosition().z
    //         ),
    //         Vector3.Down(),
    //         0.13
    //     );
    //     for (const mesh of this.scene.meshes) {
    //         if (
    //             mesh === this.avatar.root ||
    //             mesh === this.avatar.rootMesh ||
    //             mesh.name.includes('skybox') ||
    //             mesh.id === '__root__' ||
    //             mesh.name === '__root__' ||
    //             this.avatar.meshes.includes(mesh)
    //         ) {
    //             continue;
    //         }
    //         return (
    //             this.scene
    //                 .getPhysicsEngine()
    //                 ?.raycast(ray.origin, ray.origin.add(ray.direction.scale(ray.length))).body !== undefined
    //         );
    //     }
    //     return false;
    // }

    setJump(): void {
        this.movementKeys.Space = true;
    }

    run() {
        if (this.avatar.isCrouching) return;

        this.setCrouch(false);
        this.avatar.isRunning = true;
        this._moveSpeed = AvatarController.RUN_SPEED;
    }

    walk(): void {
        if (this.avatar.isCrouching) return;

        this.avatar.isRunning = false;
        this._moveSpeed = AvatarController.WALK_SPEED;
    }

    toggleRun(): void {
        if (this.avatar.interaction) return;

        if (this.avatar.isRunning) {
            if (this.avatar.isCrouching) return;
            this.avatar.isRunning = false;
            this._moveSpeed = AvatarController.WALK_SPEED;
        } else {
            this.setCrouch(false);
            this.avatar.isRunning = true;
            this._moveSpeed = AvatarController.RUN_SPEED;
        }
    }

    toggleCrouch(): void {
        if (this.avatar.interaction || !this.avatar.isGrounded) return;

        if (this.avatar.isRunning) {
            this.avatar.isRunning = false;
            this.setCrouch(true);
            return;
        }

        this.avatar.isCrouching = !this.avatar.isCrouching;
        this.setCrouch();
    }

    setCrouch(force?: boolean): void {
        if (force === true) {
            this.avatar.isCrouching = true;
        } else if (force === false) {
            this.avatar.isCrouching = false;
        }

        if (this.avatar.isCrouching) {
            this.avatar.isRunning = false;
            this._moveSpeed = AvatarController.CROUCH_SPEED;
            this.avatar.toggleCrouchCapsuleBody(true);

            // add Y offset so the camera also moves down when crouches down
            this.oldCameraPosition.y += this.avatar.headHeight * 0.5;
        } else if (!this.avatar.isCrouching) {
            if (this.avatar.isRunning) {
                this._moveSpeed = AvatarController.RUN_SPEED;
            } else {
                this._moveSpeed = AvatarController.WALK_SPEED;
            }
            this.avatar.toggleCrouchCapsuleBody(false);

            // remove Y offset so the camera also moves up when stands up
            this.oldCameraPosition.y -= this.avatar.headHeight * 0.5;
        }
    }

    stopAllMovements(): void {
        this.movementKeys.KeyW = false;
        this.movementKeys.KeyA = false;
        this.movementKeys.KeyS = false;
        this.movementKeys.KeyD = false;
        this.movementKeys.ArrowUp = false;
        this.movementKeys.ArrowLeft = false;
        this.movementKeys.ArrowDown = false;
        this.movementKeys.ArrowRight = false;
        this.movementKeys.Space = false;
    }

    setJoystickAxes(x: number, y: number): void {
        this._joystickAxes.x = x;
        this._joystickAxes.y = y;
    }

    setXRState(state: 0 | 1 | 2 | 3): void {
        this._xrState = state;
    }

    setXRCamera(camera: WebXRCamera): void {
        this._xrCamera = camera;
    }

    getPositionVector(): Vector3 {
        return this.avatar.getPosition();
    }
    getRotationQuarternion(): Quaternion {
        return (
            this.avatar.root.rotationQuaternion ??
            this.avatar.root.rotation.toQuaternion()
        );
    }
    getCurrentAnimation(): string {
        return (
            this.avatar.playingAnimation?.name ??
            (this.avatar.gender === "male" ? "Male" : "Female") + "Idle"
        );
    }
    getIsAnimationLooping(): boolean {
        return this.avatar.isPlayingAnimationLooping;
    }
    getIsGrounded(): boolean {
        return this.avatar.isGrounded;
    }
    getIsMoving(): boolean {
        return this.avatar.isMoving;
    }
    getIsCrouching(): boolean {
        return this.avatar.isCrouching;
    }
    getLookTarget(): Nullable<Vector3> {
        return this.avatar.currentBoneLookControllerTarget;
    }

    dispose(): void {
        this.stop();
        this.keyboardPressObserver.remove();
        this.customHeadNode.dispose();
    }
}

export type AvatarControllerType = InstanceType<typeof AvatarController>;
