import "@babylonjs/core/Engines/Extensions/engine.query"; // for occlusion queries
import "@babylonjs/core/Rendering/boundingBoxRenderer"; // for occlusion queries
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import type { PostTrinket } from "@/apis/entities";

import type { Scene3D } from "@/3d/Scene3D";
import type { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

export class Gift {
  readonly scene3D: Scene3D;
  readonly scene: Scene;
  readonly trinketParams: PostTrinket;

  giftModelRoot: Nullable<AbstractMesh> = null;
  giftModelMeshes: Array<AbstractMesh> = [];

  cardContainerNode: Nullable<TransformNode> = null;
  card: Nullable<Mesh> = null;
  cardImageURL: string = `/static/icons/adlerLogo.svg`;
  openCardButton: Nullable<Mesh | InstancedMesh> = null;
  closeCardButton: Nullable<Mesh | InstancedMesh> = null;

  isInfoCardVisible: boolean = false;
  private _giftAbsolutePosition: Vector3 = Vector3.Zero();
  private _giftMaxHeight: number = 0;

  giftAnimationObserver: Nullable<Observer<Scene>> = null;
  cardOpenedObserver: Nullable<Observer<Scene>> = null;

  constructor(scene3D: Scene3D, trinketParams: PostTrinket) {
    this.scene3D = scene3D;
    this.scene = scene3D.scene;
    this.trinketParams = trinketParams;
  }

  async loadTrinketModel(trinketIdToLoad: string): Promise<void> {
    const trinketToLoad = this.scene3D.trinkets[trinketIdToLoad];
    if (!(trinketIdToLoad in this.scene3D.trinkets)) return;

    const setGiftTransforms = (
      root: AbstractMesh,
      trinketParams: PostTrinket
    ): void => {
      const { position, rotation } = trinketParams;
      const posVec3 = new Vector3(position.x, position.y, position.z);
      this._giftAbsolutePosition = posVec3;
      root.setAbsolutePosition(posVec3);
      root.rotation = new Vector3(rotation.x, rotation.y, rotation.z);
      // root.scaling = new Vector3(scale.x, scale.y, scale.z);
      root.scaling = Vector3.One();

      this._giftMaxHeight = root.getHierarchyBoundingVectors(true).max.y;
    };

    const processImportedModel = (
      root: AbstractMesh,
      noTexture?: boolean
    ): void => {
      root.scaling.x *= -1;

      root
        .getChildMeshes(false, (mesh) => mesh.getClassName() === "Mesh")
        .forEach((mesh) => {
          if (noTexture)
            mesh.material = this.scene.getMaterialByName("defaultMaterial");

          mesh.receiveShadows = true;
          mesh.isPickable = false;
          mesh.material?.freeze();
          // mesh.renderingGroupId = 2;
          // mesh.occlusionType = 1; //AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
          // // mesh.occlusionQueryAlgorithmType = 0; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE;
          // mesh.occlusionQueryAlgorithmType = 1; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
          // mesh.isOccluded = false; // don't make object occluded by default
        });

      // make gift bob up and down
      let elapsedTime = 0;
      const giftPosition = root.position.y;
      this.giftAnimationObserver = this.scene.onBeforeRenderObservable.add(
        () => {
          if (!this.scene || this.scene.isDisposed) return;

          const delta = this.scene.getEngine().getDeltaTime() / 1000;
          root.position.y = giftPosition + Math.sin(elapsedTime) * 0.1;
          if (this.openCardButton) {
            this.openCardButton.setAbsolutePosition(
              new Vector3(
                this._giftAbsolutePosition.x,
                this._giftMaxHeight + 0.2 + Math.sin(elapsedTime) * 0.1,
                this._giftAbsolutePosition.z
              )
            );
          }
          elapsedTime += delta * 2;
        }
      );
    };

    const container = this.scene3D.giftAssetContainers.get(trinketIdToLoad);
    if (container) {
      const instancedContainer = container.instantiateModelsToScene(
        undefined,
        false,
        {
          doNotInstantiate: false,
        }
      );

      const root = instancedContainer.rootNodes[0] as Mesh;

      this._giftMaxHeight = root.getHierarchyBoundingVectors(true).max.y;
      this.giftModelRoot = root;
      this.giftModelMeshes = root.getChildMeshes();

      setGiftTransforms(this.giftModelRoot, this.trinketParams);
      processImportedModel(this.giftModelRoot);

      if (
        this.trinketParams.cardUrl !== "" &&
        this.trinketParams.note.trim() !== ""
      ) {
        this._createOpenCardButton();
        this._createCard();
      }
      return;
    }

    const resource = this.scene3D.getResource(
      trinketToLoad.id,
      "/static/" + trinketToLoad.url + "/model.glb"
    );

    try {
      const container = await loadAssetContainerAsync(
        resource.url,
        this.scene,
        {
          pluginExtension: ".glb",
          pluginOptions: {
            gltf: {
              compileMaterials: true,
            },
          },
        }
      );

      this.scene3D.giftAssetContainers.set(trinketIdToLoad, container);

      if (this.scene.isDisposed) return;

      this.giftModelRoot = container.meshes[0];
      this.giftModelMeshes = container.meshes[0].getChildMeshes();
      this.giftModelRoot.name = trinketIdToLoad;

      setGiftTransforms(this.giftModelRoot, this.trinketParams);
      processImportedModel(this.giftModelRoot);

      container.addAllToScene();

      if (
        this.trinketParams.cardUrl !== "" &&
        this.trinketParams.note.trim() !== ""
      ) {
        this._createOpenCardButton();
        this._createCard();
      }
      // eslint-disable-next-line
    } catch (e) { }
  }

  private async _createOpenCardButton(): Promise<void> {
    if (!this.giftModelRoot) return;

    const existingMesh = this.scene.getMeshByName("giftOpenCardButtonOriginal");
    if (existingMesh) {
      const mesh = (existingMesh as Mesh).createInstance(
        "giftOpenCardButton_" +
        this.trinketParams.id +
        "_instance_" +
        this.scene.meshes.length
      );
      mesh.alwaysSelectAsActiveMesh = true; // frustum culling doesn't work well with instances
      mesh.isPickable = true;
      mesh.renderingGroupId = 2;
      mesh.occlusionType = 1; //AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
      // mesh.occlusionQueryAlgorithmType = 0; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE;
      mesh.occlusionQueryAlgorithmType = 1; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
      mesh.isOccluded = false; // don't make object occluded by default

      // mesh.parent = this.giftModelRoot;
      mesh.setAbsolutePosition(
        new Vector3(
          this._giftAbsolutePosition.x,
          this._giftMaxHeight + 0.2,
          this._giftAbsolutePosition.z
        )
      );
      mesh.billboardMode = 7; // BILLBOARDMODE_ALL

      this.openCardButton = mesh;
      return;
    }

    const tempMesh = CreateDisc(
      "giftOpenCardButtonOriginal",
      { radius: 0.08, tessellation: 32 },
      this.scene
    );
    tempMesh.convertToUnIndexedMesh();
    tempMesh.isPickable = true;
    tempMesh.renderingGroupId = 2;
    tempMesh.setEnabled(false);

    // because this mesh will have instances and frustum
    // culling and occlussion culling don't work well with instances
    // tempMesh.alwaysSelectAsActiveMesh = true;

    tempMesh.occlusionType = 0;
    // tempMesh.occlusionType = 1; //AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    // // tempMesh.occlusionQueryAlgorithmType = 0; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE;
    // tempMesh.occlusionQueryAlgorithmType = 1; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
    // tempMesh.isOccluded = false; // don't make object occluded by default

    const material = new StandardMaterial(
      "giftOpenCardButton_" + this.trinketParams.id,
      this.scene
    );

    const texture = new Texture(
      "/static/imgs/giftOpenCard.ktx2",
      this.scene,
      true,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      "image/ktx2",
      undefined,
      undefined,
      ".ktx2"
    );
    texture.optimizeUVAllocation = true;
    texture.isBlocking = true;
    material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.emissiveColor = Color3.White();
    material.disableLighting = true;
    material.freeze();
    tempMesh.material = material;

    const mesh = tempMesh.createInstance(
      "giftOpenCardButton_" +
      this.trinketParams.id +
      "_instance_" +
      this.scene.meshes.length
    );
    mesh.alwaysSelectAsActiveMesh = true; // frustum culling doesn't work well with instances
    mesh.isPickable = true;
    mesh.renderingGroupId = 2;
    mesh.occlusionType = 1; //AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    // mesh.occlusionQueryAlgorithmType = 0; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE;
    mesh.occlusionQueryAlgorithmType = 1; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
    mesh.isOccluded = false; // don't make object occluded by default

    mesh.billboardMode = 7; // BILLBOARDMODE_ALL

    this.openCardButton = mesh;
  }

  private _createCloseCardButton(
    infoCardBoundingBox: BoundingBox,
    containerNode: TransformNode
  ): void {
    const existingMesh = this.scene.getMeshByName(
      "giftCloseCardButtonOriginal"
    );
    if (existingMesh) {
      const mesh = (existingMesh as Mesh).createInstance(
        "giftCloseCardButton_" +
        this.trinketParams.id +
        "_instance_" +
        this.scene.meshes.length
      );
      mesh.alwaysSelectAsActiveMesh = true; // frustum culling doesn't work well with instances
      mesh.isPickable = true;
      mesh.renderingGroupId = 3;

      mesh.parent = containerNode;

      // place at the top right corner of card
      mesh.position.set(
        infoCardBoundingBox.extendSize.x * 1.8,
        infoCardBoundingBox.maximum.y,
        infoCardBoundingBox.maximum.z - 0.02
      );

      this.closeCardButton = mesh;
      return;
    }

    const mesh = CreateDisc(
      "giftCloseCardButtonOriginal",
      { radius: 0.03, tessellation: 32 },
      this.scene
    );
    mesh.convertToUnIndexedMesh();
    mesh.isPickable = true;
    mesh.renderingGroupId = 3;

    const material = new StandardMaterial(
      "giftCloseCardButtonMaterial_" + this.trinketParams.id,
      this.scene
    );

    const texture = new Texture(
      "/static/imgs/giftCloseCard.ktx2",
      this.scene,
      true,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      "image/ktx2",
      undefined,
      undefined,
      ".ktx2"
    );
    texture.optimizeUVAllocation = true;
    texture.isBlocking = true;
    material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.emissiveColor = Color3.White();
    material.disableLighting = true;
    material.freeze();
    mesh.material = material;

    mesh.parent = containerNode;

    // place at the top right corner of card
    mesh.position.set(
      infoCardBoundingBox.extendSize.x * 1.6,
      infoCardBoundingBox.maximum.y - 0.05,
      infoCardBoundingBox.maximum.z - 0.02
    );

    this.closeCardButton = mesh;
  }

  private _createCard(): void {
    this.cardImageURL = this.trinketParams.cardUrl;

    const existingMesh = this.scene.getMeshByName("trinketMessageCard");

    if (existingMesh) {
      const clone = existingMesh.clone(
        "trinketMessageCard_" +
        this.trinketParams.id +
        "_" +
        this.scene.meshes.length,
        null
      );
      if (!clone) {
        this.card = CreatePlane(
          "trinketMessageCard",
          { width: 0.7, height: 0.7 },
          this.scene
        );
      } else {
        this.card = clone as Mesh;
      }
    } else {
      this.card = CreatePlane(
        "trinketMessageCard",
        { width: 0.7, height: 0.7 },
        this.scene
      );
    }

    this.cardContainerNode = new TransformNode(
      "infoCardContainer_" + this.scene.meshes.length,
      this.scene
    );
    this.cardContainerNode.billboardMode = 7; // BILLBOARDMODE_ALL

    this.card.parent = this.cardContainerNode;

    this.card.computeWorldMatrix(true);
    this._createCloseCardButton(
      this.card.getBoundingInfo().boundingBox,
      this.cardContainerNode
    );

    this.card.receiveShadows = true;
    // this.card.doNotSyncBoundingInfo = true; // don't disable sync for frumstum culling
    this.card.isPickable = true;
    this.card.convertToUnIndexedMesh();
    this.card.renderingGroupId = 3;

    // hide card by default
    this.cardContainerNode.setEnabled(false);
    this.cardContainerNode.scaling.setAll(0);
  }

  async createCardTexture(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.card) return;

      // dispose existing material and texture
      this.card.material?.dispose(true, true);
      this.card.scaling.x = 1;

      const cardTexture = new Texture(
        "/static/" + this.cardImageURL,
        this.scene,
        true,
        true
      );
      cardTexture.hasAlpha = true;
      cardTexture.isBlocking = false;

      const cardMaterial = new StandardMaterial(
        "cardImageMaterial",
        this.scene ?? undefined
      );
      cardMaterial.disableLighting = true;
      cardMaterial.emissiveColor = Color3.White();
      cardMaterial.diffuseTexture = cardTexture;
      cardMaterial.useAlphaFromDiffuseTexture = true;
      cardMaterial.freeze();
      this.card.material = cardMaterial;

      cardTexture.onLoadObservable.addOnce(() => {
        if (!this.card) {
          cardTexture.dispose();
          return;
        }

        const { width, height } = cardTexture.getSize();

        // get the aspect ratio of the image and apply the ratio to the card mesh
        const aspectRatio = width / height;
        if (height > width) {
          // if the height is greater than the width, then the image is portrait
          this.card.scaling.x /= aspectRatio;
        } else {
          // if the width is greater than the height, then the image is landscape
          this.card.scaling.x *= aspectRatio;
        }
        resolve();
      });
    });
  }

  show(): void {
    this.giftModelMeshes?.forEach((mesh) => mesh.setEnabled(true));
    this.cardContainerNode?.setEnabled(true);
    this.openCardButton?.setEnabled(true);
  }

  hide(): void {
    this.giftModelMeshes?.forEach((mesh) => mesh.setEnabled(false));
    this.cardContainerNode?.setEnabled(false);
    this.openCardButton?.setEnabled(false);
  }

  dispose(disposeTextures: boolean = false): void {
    this.giftAnimationObserver?.remove();

    // dispose cards as well
    this.openCardButton?.dispose(false, disposeTextures);
    this.closeCardButton?.dispose(false, disposeTextures);
    this.cardContainerNode?.dispose(false, disposeTextures);
    this.card?.dispose(false, disposeTextures);

    if (disposeTextures) {
      this.scene
        .getMeshByName("giftOpenCardButtonOriginal")
        ?.dispose(false, true);
      this.scene
        .getMeshByName("giftCloseCardButtonOriginal")
        ?.dispose(false, true);
      this.scene.getMeshByName("trinketMessageCard")?.dispose(false, true);
    }

    // don't dispose textures and materials to utilize cache for faster loading
    this.giftModelRoot?.dispose(false, disposeTextures);
  }
}

export type GiftType = InstanceType<typeof Gift>;
