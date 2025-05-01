import "@babylonjs/core/Physics/v2/physicsEngineComponent"; // for scene.enablePhysics() function
import "@babylonjs/core/Rendering/boundingBoxRenderer"; // for occlusion queries

import { Animation } from "@babylonjs/core/Animations/animation";
import { CubicEase } from "@babylonjs/core/Animations/easing";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";

import { Atom3D } from "@/3d/Atom3D";
import { Engine3D } from "@/3d/Engine3D";
import { Gift } from "@/3d/Gift";
import { Resource } from "@/3d/Resource";
import { Avatar } from "@/3d/Avatar/Avatar";
import { AvatarController } from "@/3d/Avatar/AvatarController";
import type {
    AvatarGender,
    PostTrinket,
    TrinketThumbnail,
} from "@/apis/entities";
import {
    AVATAR_CONTROLLER_PARAMS,
    AVATAR_PARAMS,
    MULTIPLAYER_PARAMS,
    WORLD_GRAVITY,
} from "@/constant";
import guestAvatarJSON from "@/jsons/guest-avatars.json";
import postGiftsJSON from "@/jsons/post_gifts.json";
import trinketsJSON from "@/jsons/trinkets.json";
import eventBus from "@/eventBus";
import { isMobile } from "@/utils/browserUtils";

import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";

export class Scene3D {
    readonly engine3D: Engine3D;
    readonly scene: Scene;
    readonly camera: ArcRotateCamera;
    readonly atom: Atom3D;
    readonly trinkets: Record<string, TrinketThumbnail>;
    readonly assetUrls: Record<string, Resource>;
    gifts: Gift[] = [];
    giftAssetContainers: Map<string, AssetContainer>;
    avatar?: Avatar;
    avatarController?: AvatarController;
    pointerPickObserver?: Observer<PointerInfo>;
    private _movedCamera: boolean = false;

    constructor(engine3D: Engine3D) {
        this.engine3D = engine3D;
        this.scene = this._createScene(engine3D.engine);
        this.camera = this._createCamera(this.scene);
        this.atom = new Atom3D(this);

        this.trinkets = Object.fromEntries(
            trinketsJSON.results.map((item) => [item.id, item])
        );
        this.assetUrls = {};
        this.giftAssetContainers = new Map<string, AssetContainer>();

        eventBus.once("space:scenePhysicsEnabled", (scene) => {
            const randomAvatar =
                guestAvatarJSON[Math.floor(Math.random() * guestAvatarJSON.length)];
            this.avatar = new Avatar(
                scene,
                `https://models.readyplayer.me/${randomAvatar.id}.glb?
                    useDracoMeshCompression=true
                    &useQuantizeMeshOptCompression=true
                    &meshLod=1
                    &textureSizeLimit=1024
                    &textureAtlas=1024
                    &textureFormat=webp
                `.replace(/\s+/g, ""),
                randomAvatar.gender as AvatarGender
            );
            this.avatar.loadAvatar();

            this.avatarController = new AvatarController(
                this.avatar,
                this.camera,
                scene
            );

            if (this.atom.isPhysicsGenerated) {
                this.avatar?.loadPhysicsBodies();
                this.avatarController?.start();
            } else {
                eventBus.once("space:physicsReady", () => {
                    this.avatar?.loadPhysicsBodies();
                    this.avatarController?.start();
                });
            }
        });

        if (!this.atom.isAllLODSLoaded) {
            eventBus.once("space:allLODsLoaded", () => this.loadPostGifts());
        } else {
            this.loadPostGifts();
        }

        engine3D.engine.runRenderLoop(() => {
            if (this.scene.activeCamera) this.scene.render();
        });
    }

    private _createScene(engine: Engine): Scene {
        const scene = new Scene(engine, {
            useGeometryUniqueIdsMap: true,
            useMaterialMeshMap: true, // speed-up the disposing of Material by reducing the time spent to look for bound meshes
            useClonedMeshMap: true, // speed-up the disposing of Mesh by reducing the time spent to look for associated cloned meshes
        });

        // disable the default scene clearing behavior
        scene.autoClear = false; // Color buffer
        scene.autoClearDepthAndStencil = true; // Depth and stencil

        // for gift occlusion culling
        scene.setRenderingAutoClearDepthStencil(1, false, false, false);
        scene.setRenderingAutoClearDepthStencil(2, false, false, false);

        // set transparent background color
        scene.clearColor = new Color4(0, 0, 0, 0);

        scene.skipPointerMovePicking = true;
        scene.skipPointerDownPicking = true;
        scene.skipPointerUpPicking = true;

        scene.pointerMovePredicate = () => false;
        scene.pointerDownPredicate = () => false;
        scene.pointerUpPredicate = () => false;

        scene.constantlyUpdateMeshUnderPointer = false;

        scene.audioEnabled = false;
        scene.collisionsEnabled = false;
        scene.fogEnabled = false;
        scene.lightsEnabled = false;
        scene.shadowsEnabled = false;

        // enable havok physics with gravity
        const enableHavokPhysics = async (havok: HavokPhysicsWithBindings) => {
            const havokPlugin = new HavokPlugin(true, havok);
            const gravityVector = new Vector3(0, WORLD_GRAVITY, 0);
            scene.enablePhysics(gravityVector, havokPlugin);
            eventBus.emit("space:scenePhysicsEnabled", scene);
        };

        if (this.engine3D.havok) {
            enableHavokPhysics(this.engine3D.havok);
        } else {
            eventBus.once("havok:ready", (havok: HavokPhysicsWithBindings) => {
                enableHavokPhysics(havok);
            });
        }

        eventBus.emit("space:sceneCreated", scene);

        return scene;
    }

    private _createCamera(scene: Scene): ArcRotateCamera {
        const camera = new ArcRotateCamera(
            "camera",
            -Math.PI * 0.5,
            Math.PI * 0.5,
            MULTIPLAYER_PARAMS.DEFAULT_CAMERA_RADIUS,
            new Vector3(0, 1.75, 0),
            scene,
            true
        );

        // disable panning
        camera.panningSensibility = 0;

        // dampen rotation
        camera.inertia = 0.8;

        // disable rotation using keyboard arrow key
        camera.keysUp = [];
        camera.keysDown = [];
        camera.keysLeft = [];
        camera.keysRight = [];

        camera.minZ = MULTIPLAYER_PARAMS.CAMERA_MINZ;
        camera.maxZ = MULTIPLAYER_PARAMS.CAMERA_MAXZ;

        // lower zooming sensitivity on mobile
        camera.pinchPrecision = 200;
        camera.wheelPrecision = 100;

        const aspectRatio = this.engine3D.engine.getAspectRatio(camera);
        camera.fov =
            aspectRatio > 0.7
                ? AVATAR_CONTROLLER_PARAMS.FOV_THIRDPERSON
                : AVATAR_CONTROLLER_PARAMS.FOV_THIRDPERSON_MOBILE;

        // camera min distance and max distance
        camera.lowerRadiusLimit = AVATAR_PARAMS.CAMERA_RADIUS_LOWER_AVATAR;
        camera.upperRadiusLimit = AVATAR_PARAMS.CAMERA_RADIUS_UPPER_AVATAR;

        //  lower rotation sensitivity, higher value = less sensitive
        camera.angularSensibilityX = isMobile()
            ? AVATAR_PARAMS.CAMERA_HORIZONTAL_ROTATION_SPEED_AVATAR_MOBILE
            : AVATAR_PARAMS.CAMERA_HORIZONTAL_ROTATION_SPEED_AVATAR;
        camera.angularSensibilityY = isMobile()
            ? AVATAR_PARAMS.CAMERA_HORIZONTAL_ROTATION_SPEED_AVATAR_MOBILE
            : AVATAR_PARAMS.CAMERA_HORIZONTAL_ROTATION_SPEED_AVATAR;

        // limit up and down rotation range
        camera.lowerBetaLimit = AVATAR_PARAMS.CAMERA_BETA_LOWER_LIMIT_AVATAR; // looking down (divided by lower value = lower angle)
        camera.upperBetaLimit = AVATAR_PARAMS.CAMERA_BETA_UPPER_LIMIT_AVATAR; // looking up (divided by higher value = lower angle)

        // remove horizontal rotation limitation
        camera.lowerAlphaLimit = null;
        camera.upperAlphaLimit = null;

        camera.attachControl();

        eventBus.emit("space:cameraCreated", camera);

        return camera;
    }

    async loadPostGifts(): Promise<void> {
        // create list of gifts with unique gift ids and gifts that have repeated ids for more optimal 3D loading
        const repeatedObjects: PostTrinket[] = [];
        const uniqueObjects: PostTrinket[] = [];
        const uniqueIds: string[] = [];

        postGiftsJSON.results.forEach((gift) => {
            if (uniqueIds.includes(gift.trinketId)) {
                repeatedObjects.push(gift);
            } else {
                uniqueIds.push(gift.trinketId);
                uniqueObjects.push(gift);
            }
        });

        Promise.all(
            uniqueObjects.map(async (trinket) => {
                const gift = new Gift(this, trinket);
                return gift.loadTrinketModel(trinket.trinketId).then(() => {
                    repeatedObjects.forEach((repeatedTrinket) => {
                        if (repeatedTrinket.trinketId !== trinket.trinketId) return;
                        const gift = new Gift(this, repeatedTrinket);
                        gift.loadTrinketModel(repeatedTrinket.trinketId);
                    });
                });
            })
        ).then(() => {
            this.setupGiftCardClick();
        });
    }

    setupGiftCardClick() {
        let start = 0;

        this.camera.onViewMatrixChangedObservable.add(() => {
            this._movedCamera = true;
        });

        this.pointerPickObserver ??= this.scene.onPointerObservable.add(
            (pointerInfo) => {
                // register left click only
                if (pointerInfo.event.button !== 0) return;

                const processPickedMesh = (pickedMesh: AbstractMesh | Mesh): void => {
                    // get gift that the mesh belongs to
                    const gift = this.gifts.find((gift) =>
                        pickedMesh === gift.openCardButton ||
                        pickedMesh === gift.closeCardButton
                    );
                    if (!gift) return;

                    if (!gift.cardContainerNode) return;

                    if (pickedMesh === gift.openCardButton) {
                        if (gift.isInfoCardVisible) return;

                        // check if there's already a card being opened from another gift
                        const existingCardOpened = this.gifts.some(
                            (existingGift) => existingGift.isInfoCardVisible && existingGift !== gift
                        );

                        if (existingCardOpened) return;

                        gift.openCardButton.setEnabled(false);
                        gift.cardContainerNode.setEnabled(true);

                        gift.createCardTexture().then(() => {
                            if (!gift.openCardButton || !gift.cardContainerNode) return;

                            // make all other gifts' meshes not pickable to prevent
                            // not able to click close button, somehow when close button is in
                            // front of a gift object, the pick event picks the gift object instead...
                            this.gifts.forEach((gift) => {
                                if (gift.openCardButton) {
                                    gift.openCardButton.isPickable = false;
                                }
                                gift.giftModelMeshes.forEach((mesh) => {
                                    mesh.isPickable = false;
                                });
                            });

                            // set scaling of card to 1
                            const cubicEase = new CubicEase();
                            cubicEase.setEasingMode(CubicEase.EASINGMODE_EASEIN);
                            Animation.CreateAndStartAnimation(
                                "giftCardPopUp",
                                gift.cardContainerNode,
                                "scaling",
                                60,
                                60 * 0.16,
                                gift.cardContainerNode.scaling,
                                Vector3.One(),
                                Animation.ANIMATIONLOOPMODE_CONSTANT,
                                cubicEase
                            );

                            // place gift in front of user camera view
                            gift.cardOpenedObserver =
                                this.scene.onBeforeRenderObservable.add(() => {
                                    const camera = this.scene.activeCamera;
                                    if (!camera) return;
                                    // get camera view forward
                                    const forward = camera.getForwardRay().direction;
                                    // place card in front of camera
                                    gift.cardContainerNode!.position = forward.scaleInPlace(
                                        isMobile() ? 3.25 : 2.25
                                    );
                                    gift.cardContainerNode!.parent = camera;
                                });

                            gift.isInfoCardVisible = true;
                        });
                    } else if (
                        pickedMesh === gift.closeCardButton ||
                        (pickedMesh !== gift.card &&
                            pickedMesh !== gift.closeCardButton)
                    ) {
                        if (!gift.isInfoCardVisible) return;

                        // make all other gifts' meshes pickable again
                        this.gifts.forEach((gift) => {
                            if (gift.openCardButton) {
                                gift.openCardButton.isPickable = true;
                            }
                            gift.giftModelMeshes.forEach((mesh) => {
                                mesh.isPickable = true;
                            });
                        });

                        // set scaling of card to 0
                        const cubicEase = new CubicEase();
                        cubicEase.setEasingMode(CubicEase.EASINGMODE_EASEOUT);
                        Animation.CreateAndStartAnimation(
                            "giftCardPopUp",
                            gift.cardContainerNode,
                            "scaling",
                            60,
                            60 * 0.16,
                            gift.cardContainerNode.scaling,
                            Vector3.Zero(),
                            Animation.ANIMATIONLOOPMODE_CONSTANT,
                            cubicEase,
                            () => {
                                gift.openCardButton?.setEnabled(true);
                                gift.cardContainerNode?.setEnabled(false);
                                gift.cardOpenedObserver?.remove();
                                gift.cardOpenedObserver = null;

                                gift.card?.material?.dispose(true, true);

                                gift.isInfoCardVisible = false;
                            }
                        );
                    }
                };

                switch (pointerInfo.event.type) {
                    case "mousemove":
                    case "pointermove":
                        return;
                    case "mousedown":
                    case "pointerdown":
                        this._movedCamera = false;
                        start = performance.now();
                        break;
                    case "mouseup":
                    case "pointerup": {
                        if (this._movedCamera) return;

                        // don't pick mesh if mousedown is held for more than 250ms
                        if (performance.now() - start > 250) return;

                        const pickResult = this.scene.pick(
                            pointerInfo.event.clientX,
                            pointerInfo.event.clientY
                        );
                        if (!pickResult?.pickedMesh) return;
                        processPickedMesh(pickResult.pickedMesh);
                        break;
                    }
                }
            }
        );
    }

    getResource(idAndQuality: string, path: string): Resource {
        if (idAndQuality in this.assetUrls) return this.assetUrls[idAndQuality];
        const resource = new Resource(idAndQuality, path);
        this.assetUrls[idAndQuality] = resource;
        return resource;
    }

    dispose() {
        this.pointerPickObserver?.remove();
        this.pointerPickObserver = undefined;
        this.avatar = undefined;
        this.avatarController = undefined;
        this.scene.dispose();
        this.engine3D.engine.stopRenderLoop();
    }
}
