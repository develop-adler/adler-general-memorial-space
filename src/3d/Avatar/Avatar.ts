// import '@babylonjs/core/Meshes/thinInstanceMesh'; // for PhysicsViewer
import { BoneLookController } from "@babylonjs/core/Bones/boneLookController";
// import { PhysicsViewer } from '@babylonjs/core/Debug/physicsViewer';
import {
  loadAssetContainerAsync,
  importAnimationsAsync,
} from "@babylonjs/core/Loading/sceneLoader";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import {
  PhysicsShapeCapsule,
  PhysicsShapeContainer,
  PhysicsShapeCylinder,
  PhysicsShapeSphere,
} from "@babylonjs/core/Physics/v2/physicsShape";

import { AvatarInteraction } from "./AvatarInteraction";

import type {
  AvatarGender,
  AvatarInteractionType,
  ObjectQuaternion,
  ObjectTransform,
} from "@/apis/entities";
import eventBus from "@/eventBus";
import { waitForConditionAndExecute } from "@/utils/functionUtils";

import {
  AVATAR_PARAMS,
  PHYSICS_MOTION_TYPE,
  PHYSICS_SHAPE_FILTER_GROUPS,
} from "@/constant";

import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { Skeleton } from "@babylonjs/core/Bones/skeleton";
// import type { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import type { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
// import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

type AnimationsRecord = Record<string, AnimationGroup>;

export type AvatarPhysicsShapes = {
  male: {
    normal: Nullable<PhysicsShapeCapsule>;
    short: Nullable<PhysicsShapeCapsule>;
  };
  female: {
    normal: Nullable<PhysicsShapeCapsule>;
    short: Nullable<PhysicsShapeCapsule>;
  };
  other: {
    normal: Nullable<PhysicsShapeCapsule>;
    short: Nullable<PhysicsShapeCapsule>;
  };
};

export const AVATAR_ANIMATIONS = [
  "Idle",
  "Walk",
  "Run",
  "Jump",
  "Crouch",
  "CrouchWalk",
  "Wave",
  "HipHopDance",
  "Bow",
  "Clap",
  "Cry",
  "Kick",
  "Punch",
  "ChestFlinch",
  "HeadFlinch",
  "SitLoop",
  "IdleToSit",
  "SitToIdle",
];

export class Avatar {
  readonly scene: Scene;
  readonly url: string;
  private _gender: AvatarGender;

  readonly root: TransformNode;
  private _rootMesh: Nullable<AbstractMesh> = null;
  private _meshes: Array<AbstractMesh> = [];
  private _skeleton: Nullable<Skeleton> = null;
  private _animations: Record<string, AnimationGroup> = {};
  private _boneLookController: Nullable<BoneLookController> = null;
  currentBoneLookControllerTarget: Nullable<Vector3> = null;

  private _capsuleBody: Nullable<PhysicsBody> = null;
  private _capsuleBodyNode: Nullable<TransformNode> = null;
  readonly avatarBodyShapeFull: PhysicsShapeContainer;
  readonly avatarBodyShapeCrouch: PhysicsShapeSphere;
  private readonly _physicsSyncingObservers: Array<Observer<Scene>> = [];
  private readonly _hitBoxBodies: Array<PhysicsBody> = [];
  private readonly _physicsBodies: Array<PhysicsBody> = [];
  readonly avatarBodyShapeFullForChecks: PhysicsShapeContainer;

  private _height: number = 0;
  private _capsuleCopyObserver: Nullable<Observer<Scene>> = null;

  // for physics debugging
  // private readonly physicsViewer: PhysicsViewer;

  playingAnimation: Nullable<AnimationGroup> = null;
  isPlayingAnimationLooping: boolean = true;
  isMoving: boolean = false;
  isRunning: boolean = false;
  isGrounded: boolean = false;
  isCrouching: boolean = false;
  isFalling: boolean = false;

  private _fallSceneObserver: Nullable<Observer<Scene>> = null;
  private _isCapsuleBodyColliding: boolean = false;
  private avatarFallTimeout: Nullable<NodeJS.Timeout> = null;
  avatarFallTimeoutTimer: number = 3500;
  avatarFallTimeoutCallback: Nullable<(avatar: this) => void> = null;

  interaction: Nullable<AvatarInteraction> = null;
  isAnimationsReady: boolean = false;
  isReady: boolean = false;

  private readonly _headHeight: number = AVATAR_PARAMS.CAMERA_HEAD_HEIGHT_MALE;

  constructor(
    scene: Scene,
    url: string,
    gender: AvatarGender,
    position?: Vector3 | ObjectTransform,
    rotation?: Quaternion | ObjectQuaternion
  ) {
    this.scene = scene;
    this.url = url;
    this._gender = gender;

    if (this._gender === "female")
      this._headHeight = AVATAR_PARAMS.CAMERA_HEAD_HEIGHT_FEMALE;

    const tNodeName = "avatarRootNode";
    this.root = new TransformNode(tNodeName, this.scene);

    if (position) {
      if (position instanceof Vector3) this.root.position = position.clone();
      else if (Array.isArray(position))
        this.root.position = Vector3.FromArray(position);
    }
    if (rotation) {
      if (rotation instanceof Quaternion)
        this.root.rotationQuaternion = rotation.clone();
      else if (Array.isArray(rotation))
        this.root.rotationQuaternion = Quaternion.FromArray(rotation);
    }

    this.avatarBodyShapeFull = this._createPhysicsShape(
      this.scene,
      gender,
      false
    );
    this.avatarBodyShapeCrouch = this._createPhysicsShape(
      this.scene,
      gender,
      true
    );

    this.avatarBodyShapeFullForChecks = this._createPhysicsShape(
      this.scene,
      gender,
      false
    );
    this.avatarBodyShapeFullForChecks.filterCollideMask =
      PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT;

    this._preloadAnimationResources();
  }

  get meshes(): Array<AbstractMesh> {
    return this._meshes;
  }
  get skeleton(): Nullable<Skeleton> {
    return this._skeleton;
  }
  get animations(): AnimationsRecord {
    return this._animations;
  }
  get gender(): AvatarGender {
    return this._gender;
  }
  get boneLookController(): Nullable<BoneLookController> {
    return this._boneLookController;
  }
  get capsuleBody(): Nullable<PhysicsBody> {
    return this._capsuleBody;
  }
  set gender(genderType: AvatarGender) {
    this._gender = genderType;
  }
  get headHeight(): number {
    return this._headHeight;
  }

  _createPhysicsShape(
    scene: Scene,
    gender: AvatarGender,
    isShort: boolean = false
  ): PhysicsShapeContainer | PhysicsShapeSphere {
    const capsuleHeight =
      gender === "male" || gender === "other"
        ? AVATAR_PARAMS.CAPSULE_HEIGHT_MALE
        : AVATAR_PARAMS.CAPSULE_HEIGHT_FEMALE;

    if (isShort) {
      // sphere shape for crouching (may need to update to box shape in the future)
      const shape = new PhysicsShapeSphere(
        new Vector3(0, AVATAR_PARAMS.CAPSULE_RADIUS * 2.5, 0),
        AVATAR_PARAMS.CAPSULE_RADIUS * 2.5,
        scene
      );
      shape.material = { friction: 0.4, restitution: 0 };
      shape.filterMembershipMask =
        PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF;
      shape.filterCollideMask =
        PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT |
        PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF |
        PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_OTHER;
      return shape;
    }

    const parentShape = new PhysicsShapeContainer(scene);

    const capsuleShape = new PhysicsShapeCapsule(
      new Vector3(0, AVATAR_PARAMS.CAPSULE_RADIUS, 0),
      new Vector3(0, capsuleHeight - AVATAR_PARAMS.CAPSULE_RADIUS, 0),
      AVATAR_PARAMS.CAPSULE_RADIUS,
      scene
    );
    capsuleShape.material = { friction: 0.4, restitution: 0 };
    capsuleShape.filterMembershipMask =
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF;
    capsuleShape.filterCollideMask =
      PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT |
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF |
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_OTHER;

    const cylinderShape = new PhysicsShapeCylinder(
      new Vector3(0, AVATAR_PARAMS.CAPSULE_RADIUS * 0.5, 0),
      new Vector3(0, (capsuleHeight - AVATAR_PARAMS.CAPSULE_RADIUS) * 1.15, 0),
      AVATAR_PARAMS.CAPSULE_RADIUS * 1.1,
      scene
    );
    cylinderShape.material = { friction: 0, restitution: 0 };
    cylinderShape.filterMembershipMask =
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF;
    cylinderShape.filterCollideMask =
      PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT |
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_SELF |
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_CAPSULE_OTHER;

    parentShape.addChild(capsuleShape);
    parentShape.addChild(cylinderShape);

    return parentShape;
  }

  /**
   * Load avatar from avatar id
   */
  async loadAvatar(): Promise<this> {
    this.scene.blockMaterialDirtyMechanism = true;

    // const lods = [
    //   this.avatarModelInfo.lowQualityUrl,
    //   this.avatarModelInfo.mediumQualityUrl,
    //   this.avatarModelInfo.highQualityUrl,
    // ];

    // wait until scene environment map is loaded then load avatar
    // otherwise, the entire avatar will be black
    if (!this.scene.environmentTexture) {
      await waitForConditionAndExecute(
        () => this.scene.environmentTexture !== null,
        undefined,
        undefined,
        undefined,
        10000
      );
      await new Promise<void>((resolve) => {
        (this.scene.environmentTexture as CubeTexture).onLoadObservable.addOnce(
          () => {
            resolve();
          }
        );
      });
    } else if (this.scene.environmentTexture.isReady() === false) {
      await new Promise<void>((resolve) => {
        (this.scene.environmentTexture as CubeTexture).onLoadObservable.addOnce(
          () => {
            resolve();
          }
        );
      });
    }

    const container = await loadAssetContainerAsync(this.url, this.scene, {
      pluginExtension: ".glb",
      pluginOptions: {
        gltf: {
          compileMaterials: true,
        },
      },
    });
    container.addAllToScene();

    this._rootMesh = container.meshes[0];
    this._meshes = container.meshes.slice(1);
    this._skeleton = container.skeletons[0];

    container.meshes.forEach((mesh, i) => {
      // is root mesh, skip
      if (i === 0) {
        mesh.parent = this.root; // assign root as parent
        mesh.isPickable = false;
        mesh.layerMask = 1 << 0; // visible on layer 0
        return;
      }

      const meshYPosition = mesh.getBoundingInfo().boundingBox.maximumWorld.y;
      if (meshYPosition > this._height) this._height = meshYPosition;

      mesh.receiveShadows = true;
      mesh.material?.freeze();
      mesh.isPickable = true;
      mesh.layerMask = 1 << 0; // visible on layer 0

      // skip frustum culling check if is own avatar
      mesh.alwaysSelectAsActiveMesh = true;
    });

    // if (this.post) {
    //   const pickingList = [...this.post.gpuPickerPickingList, ...this._meshes.map(mesh => mesh.getChildMeshes()).flat()];
    //   console.log('GPU picker picking list:', pickingList);
    //   this.post.gpuPickerPickingList = pickingList;
    //   this.post.gpuPicker.setPickingList(this.post.gpuPickerPickingList);
    // }

    // // for debugging occlusion and frustum culling
    // this.scene.onBeforeRenderObservable.add(() => {
    //   if (!this._rootMesh) return;
    //   if (this._rootMesh.getChildMeshes().every(mesh => mesh.isOccluded === true)) {
    //     console.log(`avatar ${this.user?.nickname} is occluded`);
    //   }
    // });

    this.scene.blockMaterialDirtyMechanism = false;

    const headBone = this._skeleton.bones.find((bone) =>
      bone.name.includes("Head")
    );
    const headBoneTNode = headBone?.getTransformNode();

    if (headBone && headBoneTNode) {
      this._boneLookController = new BoneLookController(
        headBoneTNode,
        headBone,
        Vector3.ZeroReadOnly,
        {
          upAxis: Vector3.DownReadOnly,
          yawAxis: Vector3.UpReadOnly,
          pitchAxis: Vector3.RightReadOnly,

          // don't allow turning head past shoulders
          minYaw: -Math.PI * 0.4, // left rotation
          maxYaw: Math.PI * 0.4, // right rotation

          // don't allow turning all the way up or down
          minPitch: -Math.PI * 0.4, // down rotation
          maxPitch: Math.PI * 0.4, // max rotation

          slerpAmount: 0.2,
        }
      );
    }

    // need to defer loading until space's collisions are ready
    // this.loadPhysicsBodies();

    // animation has to be loaded after avatar model is loaded
    // so the anims have bone target assigned
    this._loadAnimations(container.skeletons[0]);

    // this._rootMesh.getChildMeshes().forEach(mesh => {
    //   if (this.highlightLayer) {
    //     this.highlightLayer.removeMesh(mesh as Mesh);
    //     this.highlightLayer.addExcludedMesh(mesh as Mesh);
    //   }
    // });

    if (this.isAnimationsReady === true) {
      this.isReady = true;
      eventBus.emit(`avatar:ready`, this);
    } else {
      eventBus.once(`avatar:animationsReady`, () => {
        this.isReady = true;
        eventBus.emit(`avatar:ready`, this);
      });
    }

    // progressive LOD loading, commented out due to having issues with animations
    // (async () => {
    //   for await (const lod of lods.slice(1)) {
    //     let lodResults: ISceneLoaderAsyncResult;
    //     try {
    //       lodResults = await SceneLoader.ImportMeshAsync(
    //         '',
    //         lod,
    //         '',
    //         this.scene,
    //         undefined,
    //         '.glb'
    //       );
    //     } catch (e) {
    //       console.error('Error loading avatar model:', e);
    //       continue;
    //     }

    //     this.url = lod;

    //     this._retargetAnimations(lodResults.skeletons[0]);
    //     this._processMeshes(lodResults.meshes);

    //     if (!lod.includes('high')) {
    //       if (this._rootMesh) {
    //         this.scene.removeMesh(this._rootMesh, true);

    //         this._meshes.forEach(mesh => {
    //           this.scene.removeMesh(mesh, true);
    //         });
    //       }
    //     } else {
    //       this._rootMesh?.dispose(false, true);
    //       this._meshes.forEach(mesh => mesh.dispose(false, true));
    //     }

    //     this._rootMesh = lodResults.meshes[0];
    //     this._meshes = lodResults.meshes.slice(1);
    //     this._skeleton = lodResults.skeletons[0];
    //   }
    // })();

    return this;
  }

  // private _retargetAnimations(skeleton: Skeleton) {
  //   Object.values(this._animations).forEach(anim => {
  //     // find matching bone name in new skeleton to animatable
  //     // target in original animation then assign bone from original skeleton
  //     for (const clip of anim.targetedAnimations) {
  //       if (!clip.target) continue;
  //       const boneindex = skeleton.getBoneIndexByName(clip.target.name);
  //       clip.target = skeleton.bones[boneindex].getTransformNode();
  //     }
  //   });

  //   setTimeout(() => {
  //     if (this.playingAnimation) {
  //       const currentAnim = this.playingAnimation;
  //       this.playingAnimation.stop(true);
  //       this.playingAnimation = null;
  //       this.playAnimation(currentAnim, true);
  //     }
  //   }, 1000 / 60);
  // }

  private async _preloadAnimationResources() {
    AVATAR_ANIMATIONS.forEach(async (animName) => {
      const name =
        this._gender === "male"
          ? `Male${animName}.glb`
          : `Female${animName}.glb`;
      const url = "/static/avatar/animations/" + name;
      fetch(url);
    });
  }

  private async _loadAnimations(skeleton: Skeleton) {
    // import animations and retarget to this skeleton
    await Promise.all(
      // resources.map(async ({ url }) => {
      AVATAR_ANIMATIONS.map(async (animName) => {
        const fileName =
          this._gender === "male"
            ? `Male${animName}.glb`
            : `Female${animName}.glb`;
        const url = "/static/avatar/animations/" + fileName;

        await importAnimationsAsync(url, this.scene, {
          pluginExtension: ".glb",
          overwriteAnimations: false,
          animationGroupLoadingMode: 3, // SceneLoaderAnimationGroupLoadingMode.NOSYNC
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          targetConverter: (target: any) => {
            // get bone index of this avatar's skeleton from target name
            const boneIndex = skeleton.getBoneIndexByName(target.name);

            // return null if not found
            if (boneIndex === -1) return null;

            // retarget animation to this avatar's skeleton
            return skeleton.bones[boneIndex].getTransformNode();
          },
          pluginOptions: {
            gltf: {
              animationStartMode: 0, // GLTFLoaderAnimationStartMode.NONE
            },
          },
        });

        const importedAnimation = this.scene.animationGroups.at(-1);

        if (!importedAnimation) return;

        // stop animation to prevent it from playing and loop infinitely
        importedAnimation.targetedAnimations.forEach((ta) => {
          this.scene.stopAnimation(ta.target, ta.animation.name);
        });
        // importedAnimation.stop(true); // for some reason this doesn't work at all
        importedAnimation.enableBlending = true;
        importedAnimation.blendingSpeed = 0.05;

        const animationName =
          this._gender.charAt(0).toUpperCase() +
          this._gender.slice(1) +
          animName;
        this._animations[animationName] = importedAnimation;
      })
    );

    this.playingAnimation = null;
    this.isAnimationsReady = true;
    eventBus.emit(`avatar:animationsReady`, this);
  }

  loadPhysicsBodies(): void {
    // capsule body always has to be generated after the physics bodies
    // otherwise the physics bodies' position will not be correct
    this._capsuleBody = this._generateCapsuleBody(this.root.position);
    this._createGroundCheckBody();
  }

  private _generateCapsuleBody(position?: Vector3): PhysicsBody {
    const capsuleHeight =
      this._gender === "male"
        ? AVATAR_PARAMS.CAPSULE_HEIGHT_MALE
        : AVATAR_PARAMS.CAPSULE_HEIGHT_FEMALE;

    this._capsuleBodyNode ??= new TransformNode(
      "avatarCapsuleBodyNode",
      this.scene
    );

    if (position) this._capsuleBodyNode.position = position;
    else this._capsuleBodyNode.position = Vector3.Zero();

    const body = new PhysicsBody(
      this._capsuleBodyNode,
      PHYSICS_MOTION_TYPE.DYNAMIC,
      true,
      this.scene
    );
    body.shape = this.avatarBodyShapeFull;

    body.setMassProperties({
      centerOfMass: new Vector3(0, capsuleHeight * 0.5, 0),
      mass: this._gender === "male" ? 65 : 45,
      inertia: Vector3.Zero(),
    });
    body.setCollisionCallbackEnabled(true);
    body.setCollisionEndedCallbackEnabled(true);

    body.getCollisionObservable().add((collisionEvent) => {
      switch (collisionEvent.type) {
        case "COLLISION_STARTED":
        case "COLLISION_CONTINUED":
          this._isCapsuleBodyColliding = true;
          break;
      }
    });
    body.getCollisionEndedObservable().add(() => {
      this._isCapsuleBodyColliding = false;
    });

    this._physicsBodies.push(body);

    this._capsuleCopyObserver?.remove();
    this._capsuleCopyObserver = this.scene.onAfterPhysicsObservable.add(() => {
      if (!this._capsuleBodyNode) return;
      this.root.setAbsolutePosition(this._capsuleBodyNode.absolutePosition);
    });

    eventBus.emit(`avatar:capsuleBodyCreated`, body);

    this._fallSceneObserver = this.scene.onAfterPhysicsObservable.add(() => {
      // if is falling and capsule body isn't colliding with anything
      // start timeout to check if avatar is falling infinitely in the air
      if (this.isFalling === true && this._isCapsuleBodyColliding === false) {
        this.avatarFallTimeout ??= setTimeout(() => {
          this.avatarFallTimeoutCallback?.(this);
        }, this.avatarFallTimeoutTimer);
      } else {
        // clear timeout if avatar is not falling or is colliding with something
        if (this.avatarFallTimeout) {
          clearTimeout(this.avatarFallTimeout);
          this.avatarFallTimeout = null;
        }
      }
    });

    // for physics debugging
    // this.physicsViewer.showBody(body);

    return body;
  }

  setFallTimeoutTimer(timer: number) {
    this.avatarFallTimeoutTimer = timer;
  }

  setFallTimeoutCallback(callback: (avatar: Avatar) => void) {
    this.avatarFallTimeoutCallback = callback;
  }

  private _createGroundCheckBody(): void {
    const bodyNode = new TransformNode("groundCheckBody_node", this.scene);
    bodyNode.setAbsolutePosition(this.root.getAbsolutePosition());

    const shape = new PhysicsShapeSphere(Vector3.Zero(), 0.1, this.scene);
    shape.material = { friction: 0, restitution: 0 };
    shape.filterMembershipMask =
      PHYSICS_SHAPE_FILTER_GROUPS.AVATAR_GROUND_CHECK;
    shape.filterCollideMask = PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT;

    const body = new PhysicsBody(
      bodyNode,
      PHYSICS_MOTION_TYPE.DYNAMIC,
      false,
      this.scene
    );
    body.shape = shape;
    body.setMassProperties({
      centerOfMass: bodyNode.absolutePosition,
      mass: 0.1,
      inertia: Vector3.Zero(),
    });

    body.setCollisionCallbackEnabled(true);
    body.setCollisionEndedCallbackEnabled(true);

    let isGroundedTimeout: Nullable<NodeJS.Timeout> = null;
    body.getCollisionObservable().add((collisionEvent) => {
      switch (collisionEvent.type) {
        case "COLLISION_STARTED":
        case "COLLISION_CONTINUED":
          if (isGroundedTimeout) {
            clearTimeout(isGroundedTimeout);
            isGroundedTimeout = null;
          }
          // this means character is landing
          if (!this.isGrounded) {
            eventBus.emit(`avatar:landing`, this);
          }
          this.isGrounded = true;
          break;
      }
    });
    body.getCollisionEndedObservable().add(() => {
      if (isGroundedTimeout) {
        clearTimeout(isGroundedTimeout);
        isGroundedTimeout = null;
      }
      isGroundedTimeout = setTimeout(() => {
        isGroundedTimeout = null;
        this.isGrounded = false;
      }, 1000 / 24);
    });

    const plugin = this.scene.getPhysicsEngine()?.getPhysicsPlugin();
    if (plugin) {
      this._physicsSyncingObservers.push(
        this.scene.onAfterPhysicsObservable.add(() => {
          (plugin as HavokPlugin)._hknp.HP_Body_SetPosition(
            body._pluginData.hpBodyId,
            this.root.getAbsolutePosition().asArray()
          );
        })
      );
    }

    this._physicsBodies.push(body);

    // for physics debugging
    // this.physicsViewer.showBody(body);
  }

  clearAllMeshes(): void {
    this._meshes.forEach((mesh) => mesh.dispose(false, true));
    this._meshes = [];
  }

  playAnimation(
    animation: string | AnimationGroup,
    loop: boolean = true,
    speedRatio: number = 1
  ): void {
    // const animRatio = this.scene.getAnimationRatio();
    // const animSpeed = animRatio < 1 ? 1 : animRatio;

    if (typeof animation === "string") {
      let animationName = animation;
      const gender =
        this._gender.charAt(0).toUpperCase() + this._gender.slice(1);

      // prefix gender to animation name if not already prefixed
      if (!animationName.includes(gender)) {
        animationName = gender + animationName;
      }

      if (
        !(animationName in this._animations) ||
        this._animations[animationName] === this.playingAnimation
      )
        return;

      this.playingAnimation?.stop();
      this.playingAnimation = this._animations[animationName];
      this.isPlayingAnimationLooping = loop;
      this.playingAnimation.start(loop, speedRatio);
    } else {
      if (this.playingAnimation === animation) return;

      this.playingAnimation?.stop();
      this.playingAnimation = animation;
      this.isPlayingAnimationLooping = loop;
      this.playingAnimation.start(loop, speedRatio);
    }
  }

  playInteraction(name: string, type: AvatarInteractionType): void {
    this.interaction = new AvatarInteraction(this, name, type);
    this.interaction.play(() => {
      this.interaction?.dispose();
      this.interaction = null;
    });
  }

  getPosition(global?: boolean): Vector3 {
    return global ? this.root.absolutePosition : this.root.position;
  }

  setPosition(position: Vector3): void {
    // no physics body or physics engine, just set root position
    const physicsEngine = this.scene.getPhysicsEngine();
    if (this._capsuleBody === null || !physicsEngine) {
      this.root.position = position;
      return;
    }

    // this._capsuleBody.disablePreStep = false;
    // this._capsuleBodyNode!.position.set(position.x, position.y, position.z);
    // this.scene.onAfterPhysicsObservable.addOnce(() => {
    //   this._capsuleBody!.disablePreStep = true;
    // });

    // more consise version but only works with Havok physics plugin
    const plugin = physicsEngine.getPhysicsPlugin();
    (plugin as HavokPlugin)._hknp.HP_Body_SetPosition(
      this._capsuleBody._pluginData.hpBodyId,
      position.asArray()
    );
  }

  setRotationQuaternion(quaternion: Quaternion): void {
    this.root.rotationQuaternion = quaternion;

    const physicsEngine = this.scene.getPhysicsEngine();
    if (!this._capsuleBody || !physicsEngine) return;

    const plugin = physicsEngine.getPhysicsPlugin();
    (plugin as HavokPlugin)._hknp.HP_Body_SetOrientation(
      this._capsuleBody._pluginData.hpBodyId,
      quaternion.asArray()
    );
  }

  show(affectPhysicsBody: boolean = false): void {
    this._meshes.forEach((mesh) => mesh.setEnabled(true));
    if (affectPhysicsBody && this._capsuleBody) {
      const plugin = this.scene
        .getPhysicsEngine()!
        .getPhysicsPlugin() as HavokPlugin;
      plugin._hknp.HP_World_AddBody(
        plugin.world,
        this._capsuleBody._pluginData.hpBodyId,
        this._capsuleBody.startAsleep
      );
    }
  }

  hide(affectPhysicsBody: boolean = false): void {
    this._meshes.forEach((mesh) => mesh.setEnabled(false));
    if (affectPhysicsBody && this._capsuleBody) {
      const plugin = this.scene
        .getPhysicsEngine()!
        .getPhysicsPlugin() as HavokPlugin;
      plugin._hknp.HP_World_RemoveBody(
        plugin.world,
        this._capsuleBody._pluginData.hpBodyId
      );
      this._isCapsuleBodyColliding = false;
    }
  }

  toggleCrouchCapsuleBody(isCrouch: boolean = true): void {
    if (!this._capsuleBody || !this._capsuleBodyNode) return;

    // ========= for physics debugging =========
    // for (const mesh of this.scene.rootNodes) {
    //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //   if ((mesh as any).physicsBody) {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     this.physicsViewer.hideBody((mesh as any).physicsBody);
    //   }
    // }
    // ========= for physics debugging =========

    if (isCrouch) {
      this._capsuleBody.disableSync = true;
      this._capsuleBody.shape = this.avatarBodyShapeCrouch;
      this.scene.onAfterPhysicsObservable.addOnce(() => {
        if (this._capsuleBody) this._capsuleBody.disableSync = false;

        // for physics debugging
        // this._physicsBodies.forEach(body => this.physicsViewer.showBody(body));
      });
    } else {
      this._capsuleBody.disableSync = true;
      this._capsuleBody.shape = this.avatarBodyShapeFull;
      this.scene.onAfterPhysicsObservable.addOnce(() => {
        if (this._capsuleBody) this._capsuleBody.disableSync = false;

        // for physics debugging
        // this._physicsBodies.forEach(body => this.physicsViewer.showBody(body));
      });
    }
  }

  handleHeadRotationForAnimations(): void {
    if (this.isCrouching) {
      this.limitHeadRotation(
        -Math.PI * 0.05,
        Math.PI * 0.47,
        undefined,
        Math.PI * 0.1
      );
      return;
    }
    this.limitHeadRotation();
  }

  limitHeadRotation(
    minYaw: number = -Math.PI * 0.4,
    maxYaw: number = Math.PI * 0.4,
    minPitch: number = -Math.PI * 0.4,
    maxPitch: number = Math.PI * 0.4
  ): void {
    if (!this._boneLookController) return;

    this._boneLookController.minYaw = minYaw;
    this._boneLookController.maxYaw = maxYaw;
    this._boneLookController.minPitch = minPitch;
    this._boneLookController.maxPitch = maxPitch;
  }

  update(target: Vector3): void {
    // cases to not update bone look controller
    switch (true) {
      case !this._boneLookController:
      case !this.playingAnimation:
      case !this.isGrounded:
      case this.isCrouching && this.isMoving:
      case this.interaction?.type === "gethit":
        // - no animation is playing, no need to update bone look controller
        // - head looks up too much when in the air due to animation
        // - the head spins when avatar moves while crouching
        // - head glitches when avatar's get-hit animation is playing
        this.currentBoneLookControllerTarget = null;
        return;
    }

    this.currentBoneLookControllerTarget = target;
    this._boneLookController.target = target;

    // update the bone look controller
    this._boneLookController.update();
  }

  dispose(): void {
    this.scene.blockfreeActiveMeshesAndRenderingGroups = true;

    this._fallSceneObserver?.remove();
    this._fallSceneObserver = null;

    Object.values(this._animations).forEach((animGroup) => animGroup.dispose());
    this._animations = {};

    this._skeleton?.dispose();
    this._skeleton = null;

    this._meshes.forEach((mesh) => {
      mesh.parent = null;
      mesh.dispose();
    });
    this._meshes = [];

    this._rootMesh?.dispose(false, true);
    this._rootMesh = null;
    this.root?.dispose(false, true);

    // remove observers
    this._physicsSyncingObservers.forEach((observer) => observer.remove());
    this._capsuleCopyObserver?.remove();
    this._capsuleCopyObserver = null;

    // dispose physics bodies
    this._capsuleBody = null;
    this._physicsBodies.forEach((body) => body.dispose());

    this.scene.blockfreeActiveMeshesAndRenderingGroups = false;
  }
}

export type AvatarType = InstanceType<typeof Avatar>;
