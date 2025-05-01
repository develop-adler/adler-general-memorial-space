import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Materials/Textures/Loaders/ktxTextureLoader";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";

import type { Scene3D } from "@/3d/Scene3D";
import type {
    ObjectTransform,
    StudioDecorationObjectProperty,
    StudioMeshMetaData,
    StudioObject,
    StudioPost,
} from "@/apis/entities";
import {
    PHYSICS_SHAPE_FILTER_GROUPS,
    STUDIO_OBJECT_TYPE_DICTIONARY,
} from "@/constant";
import eventBus from "@/eventBus";
import assetsJSON from "@/jsons/asset_res.json";
import atomJSON from "@/jsons/atom.json";
import { isMobile } from "@/utils/browserUtils";
import { waitForConditionAndExecute } from "@/utils/functionUtils";

import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { Nullable } from "@babylonjs/core/types";

type ObjectQualityWithNoTexture =
    | "notexture"
    | "lowest"
    | "low"
    | "medium"
    | "high"
    | "ultra";
type ObjectLODData = {
    lods: Record<ObjectQualityWithNoTexture, Nullable<AbstractMesh>>; // low to high quality LODs order
    currentLOD: Nullable<ObjectQualityWithNoTexture>; // current LOD level (index of lods)
};

export class Atom3D {
    readonly scene3D: Scene3D;
    readonly scene: Scene;
    readonly assets: Record<string, StudioObject>;
    readonly defaultMaterial: PBRMaterial;
    skybox?: Mesh;
    atomObjects: Array<AbstractMesh> = [];
    lodObjects: Record<number, Array<AbstractMesh>> = {}; // -1: no texture, 0: low, 1: high
    readonly _meshLODData: Map<StudioDecorationObjectProperty, ObjectLODData> =
        new Map();
    private _loadStep: number = -1;
    private _isLoadingLODs: boolean = false;
    private _isObjectsLoadingFinish: boolean = false;
    currentQualityObjects: Array<AbstractMesh> = []; // only used for progressive loading
    isPhysicsGenerated: boolean = false; // will be set to true when physics of all objects is generated
    objectPhysicsShape: Map<string, PhysicsShape> = new Map();
    isAllLODSLoaded: boolean = false;

    constructor(scene3D: Scene3D) {
        this.scene3D = scene3D;
        this.scene = scene3D.scene;
        this.assets = Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assetsJSON.results.map((item: any) => [item.id, item])
        );

        this._setupCamera();

        this.defaultMaterial = this._createDefaultMaterial(this.scene);

        // 3D objects will look all black if they're loaded before scene environment map is ready
        this.loadHDRSkybox().then(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.load(atomJSON as any);
        });
    }

    private _setupCamera(): void {
        const previewCamera = atomJSON.space.previewCamera;
        this.scene3D.camera.setPosition(Vector3.FromArray(previewCamera.position));
        // for some reason the target makes the camera not look towards the pictures by default
        // this.scene3D.camera.target = Vector3.FromArray(previewCamera.target);
    }

    private _createDefaultMaterial(scene: Scene): PBRMaterial {
        const material = new PBRMaterial("defaultMaterial", scene);
        material.albedoColor = Color3.White();
        material.roughness = 0.75;
        material.metallic = 0.6;
        material.freeze();
        return material;
    }

    async loadHDRSkybox() {
        this.skybox = CreateBox("skybox", { size: 1000 }, this.scene);
        this.skybox.isPickable = false;
        this.skybox.infiniteDistance = true;
        this.skybox.ignoreCameraMaxZ = true;
        this.skybox.alwaysSelectAsActiveMesh = true;
        this.skybox.doNotSyncBoundingInfo = true;
        this.skybox.freezeWorldMatrix();
        this.skybox.convertToUnIndexedMesh();

        // Skybox material
        const hdrSkyboxMaterial = new StandardMaterial(
            "hdrSkyBoxMaterial",
            this.scene
        );
        hdrSkyboxMaterial.backFaceCulling = false;
        // hdrSkyboxMaterial.microSurface = 1.0;
        hdrSkyboxMaterial.disableLighting = true;
        hdrSkyboxMaterial.twoSidedLighting = true;
        this.skybox.material = hdrSkyboxMaterial;

        const loadSkybox = (url: string) => {
            const sceneEnvMapTexture = CubeTexture.CreateFromPrefilteredData(
                url,
                this.scene,
                ".env",
                false
            );
            this.scene.environmentIntensity = 1;
            this.scene.environmentTexture = sceneEnvMapTexture;

            hdrSkyboxMaterial.reflectionTexture = sceneEnvMapTexture.clone();
            hdrSkyboxMaterial.reflectionTexture.coordinatesMode = 5;
            return sceneEnvMapTexture;
        };

        const sceneEnvMapTexture = loadSkybox("/static/skybox/resource_low.env");

        const loadHighLODSkybox = async () => {
            const cubeTexture = CubeTexture.CreateFromPrefilteredData(
                "/static/skybox/resource.env",
                this.scene,
                ".env",
                false
            );
            cubeTexture.coordinatesMode = 5;
            if (cubeTexture.isReady()) {
                hdrSkyboxMaterial.reflectionTexture?.dispose();
                hdrSkyboxMaterial.reflectionTexture = cubeTexture;
                hdrSkyboxMaterial.freeze();
            } else {
                cubeTexture.onLoadObservable.addOnce((texture) => {
                    hdrSkyboxMaterial.reflectionTexture?.dispose();
                    hdrSkyboxMaterial.reflectionTexture = texture;
                    hdrSkyboxMaterial.freeze();
                });
            }
        };

        if (this.isAllLODSLoaded) {
            loadHighLODSkybox();
        } else {
            eventBus.once("space:allLODsLoaded", () => {
                loadHighLODSkybox();
            });
        }

        return new Promise<void>((resolve) => {
            if (sceneEnvMapTexture.isReady()) {
                eventBus.emit("space:envMapReady", this);
                resolve();
            } else {
                sceneEnvMapTexture.onLoadObservable.addOnce(() => {
                    eventBus.emit("space:envMapReady", this);
                    resolve();
                });
            }
        });
    }

    async load(studioSpace: StudioPost, executeWhenReady?: () => void) {
        const { models } = studioSpace.space.atom;

        const {
            architectures,
            furnitures,
            decorations,
            entertainments,
            images,
            objects,
        } = models;

        // add up all 3D objects to load
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allItems: any[] = [];
        if (architectures) allItems.push(...architectures);
        if (furnitures) allItems.push(...furnitures);
        if (decorations) allItems.push(...decorations);
        if (entertainments) allItems.push(...entertainments);
        if (images) allItems.push(...images);
        if (objects) allItems.push(...objects);

        const loadAtomScene = async () => {
            return this.loadAtom(allItems, executeWhenReady);
        };

        if (this.scene.environmentTexture) {
            const cubeTexture = this.scene.environmentTexture as CubeTexture;
            if (cubeTexture.isReady()) {
                loadAtomScene();
            } else {
                cubeTexture.onLoadObservable.addOnce(() => {
                    loadAtomScene();
                });
            }
        } else {
            waitForConditionAndExecute(
                () => this.scene.environmentTexture !== null
            ).then(() => {
                const cubeTexture = this.scene.environmentTexture as CubeTexture;
                if (cubeTexture.isReady()) {
                    loadAtomScene();
                } else {
                    cubeTexture.onLoadObservable.addOnce(() => {
                        loadAtomScene();
                    });
                }
            });
        }
    }

    async loadAtom(
        assetList: Array<StudioDecorationObjectProperty>,
        executeWhenReady?: () => void
    ) {
        let allItems = assetList;

        // if there are more than 1 instance of the object in the models list,
        // clone the objects instead of importing them again for better performance
        const repeatedObjects: Array<StudioDecorationObjectProperty> = [];
        const uniqueObjects: Array<StudioDecorationObjectProperty> = [];
        const uniqueIds: Array<string> = [];

        allItems.forEach((item) => {
            if (uniqueIds.includes(item.id)) {
                repeatedObjects.push(item);
            } else {
                uniqueIds.push(item.id);
                uniqueObjects.push(item);
            }

            // init LOD data
            if (!this._meshLODData.has(item)) {
                this._meshLODData.set(item, {
                    lods: {
                        notexture: null,
                        lowest: null,
                        low: null,
                        medium: null,
                        high: null,
                        ultra: null,
                    },
                    currentLOD: null,
                });
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: Array<Promise<any>> = [];

        this.scene.blockMaterialDirtyMechanism = true;

        // load no-texture version for faster load time
        promises.push(
            this.loadStudioObjectModels(
                uniqueObjects,
                repeatedObjects,
                "notexture",
                true
            )
        );

        await Promise.all(promises);

        this.scene.blockMaterialDirtyMechanism = false;

        this._isObjectsLoadingFinish = true;

        eventBus.emit("space:noTextureLoaded", this);
        eventBus.emit("space:objectsLoaded", this);

        this._loadStep++;

        this.loadCollisions();

        executeWhenReady?.();

        const loadSpaceLOD = async (quality: ObjectQualityWithNoTexture) => {
            this.scene.blockMaterialDirtyMechanism = true;
            await this.loadStudioObjectModels(
                uniqueObjects,
                repeatedObjects,
                quality
            );
            this.scene.blockMaterialDirtyMechanism = false;

            if (this._loadStep === 0) {
                // hide non-texture objects
                this.lodObjects[-1].forEach((mesh) => {
                    mesh.setEnabled(false);
                    mesh.getChildMeshes().forEach((child) => child.setEnabled(false));
                });

                // // remove non-texture models geometries for lower memory usage
                // this.lodObjects[-1].forEach(mesh => {
                //     mesh
                //         .getChildMeshes(false, (mesh): mesh is Mesh => mesh.getClassName() === 'Mesh')
                //         .forEach(mesh => {
                //             if (mesh.geometry) {
                //                 mesh.geometry.clearCachedData();
                //                 mesh.geometry.dispose();
                //             }
                //         });
                // });

                // remove image assets from list because images don't have LODs
                allItems = allItems.filter((asset) => asset.type !== "images");
            }

            switch (quality) {
                // case "lowest":
                //     eventBus.emit("space:lowestLoaded", this);
                //     break;
                case "low":
                    eventBus.emit("space:lowLoaded", this);
                    break;
                // case "medium":
                //     eventBus.emit("space:mediumLoaded", this);
                //     break;
                case "high":
                    eventBus.emit("space:highLoaded", this);
                    break;
                // case "ultra":
                //     eventBus.emit("space:ultraLoaded", this);
                //     break;
            }

            this._loadStep++;
        };

        (async () => {
            this._isLoadingLODs = true;

            // only load low quality version on mobile, load high quality LOD on other devices
            await loadSpaceLOD(isMobile() ? "low" : "high");

            this._isLoadingLODs = false;
            this.isAllLODSLoaded = true;
            eventBus.emit("space:allLODsLoaded", this);
        })();

        return this;
    }

    async loadStudioObjectModels(
        uniqueObjects: Array<StudioDecorationObjectProperty>,
        repeatedObjects: Array<StudioDecorationObjectProperty>,
        quality: ObjectQualityWithNoTexture = "high",
        noTextures: boolean = false
    ) {
        let repeatedObjectsCopy = [...repeatedObjects];

        const roots: Array<AbstractMesh> = [];
        return Promise.all(
            uniqueObjects.map(async (object) => {
                // load unique id objects first
                const studioObject = this._getAsset(object.id);

                // if is null or empty object, skip loading
                if (!studioObject) {
                    console.error(`Asset ${object.id} not found.`);
                    return;
                }

                if (studioObject.type === "images") {
                    return this.loadStudioImageObject(
                        studioObject,
                        quality,
                        object.position,
                        object.rotation,
                        [object.scale[0], object.scale[1], 1]
                    );
                }

                // add to scene
                const data = await this.loadStudioObject(
                    studioObject,
                    studioObject.type !== "objects" && quality === "notexture"
                        ? "low"
                        : quality,
                    object.position,
                    object.rotation,
                    object.scale,
                    object.image,
                    noTextures
                );

                if (!data) {
                    return;
                }

                const { root, container } = data;

                this.storeNewObjectLOD(
                    object,
                    root,
                    noTextures === true ? "notexture" : quality
                );
                roots.push(root);

                // load repeated objects by cloning after original one is added
                // (much faster and lower memory usage)
                for (const repeatedObject of repeatedObjectsCopy) {
                    if (repeatedObject.id !== studioObject.id) continue;
                    const clone = this.cloneObject(
                        root.metadata,
                        container,
                        repeatedObject.position,
                        repeatedObject.rotation,
                        repeatedObject.scale,
                        repeatedObject.image
                    );
                    if (clone) {
                        this.storeNewObjectLOD(
                            repeatedObject,
                            clone,
                            noTextures === true ? "notexture" : quality
                        );
                        roots.push(clone);
                    }
                }

                // remove from repeated objects
                repeatedObjectsCopy = repeatedObjectsCopy.filter(
                    (item) => item.id !== studioObject.id
                );
            })
        ).then(() => {
            if (!this.scene || this.scene.isDisposed) return;

            this.atomObjects = this.atomObjects.filter(
                (mesh) => !this.currentQualityObjects.includes(mesh)
            );

            this.currentQualityObjects = roots;
            this.lodObjects[this._loadStep] = this.currentQualityObjects;
        });
    }

    async loadStudioObject(
        object: StudioObject,
        quality: ObjectQualityWithNoTexture = "high",
        position?: ObjectTransform,
        rotation?: ObjectTransform,
        scale?: ObjectTransform,
        imageNameOrPath?: string,
        noTextures: boolean = false
    ) {
        if (!this.scene || this.scene.isDisposed) return null;

        const { id, path, type, title, subType } = object;

        const type3D = STUDIO_OBJECT_TYPE_DICTIONARY[subType] ?? "ground";

        const resource = this.scene3D.getResource(
            `${id}_${quality}`,
            `/static/${path}/model_${quality}.glb`
        );

        let container: AssetContainer;
        let meshes: Array<AbstractMesh> = [];

        try {
            container = await loadAssetContainerAsync(resource.url, this.scene, {
                pluginExtension: ".glb",
                pluginOptions: {
                    gltf: {
                        skipMaterials: noTextures,
                        useSRGBBuffers: !noTextures,
                        compileMaterials: !noTextures,
                        animationStartMode: !noTextures ? 2 : 0, // ALL, NONE
                        loadSkins: !noTextures,
                        loadNodeAnimations: !noTextures,
                        loadMorphTargets: !noTextures,
                    },
                },
            });
            if (noTextures) {
                container.animationGroups.forEach((animGroup) => animGroup.dispose());
            }
            meshes = container.meshes;
            // eslint-disable-next-line
        } catch (e) {
            return;
        }

        if (!this.scene || this.scene.isDisposed) return null;

        const root = meshes[0];

        if (position) root.position = Vector3.FromArray(position);
        if (rotation) {
            root.rotationQuaternion = null;
            root.rotation = rotation ? Vector3.FromArray(rotation) : Vector3.Zero();
        }
        if (scale) root.scaling = scale ? Vector3.FromArray(scale) : Vector3.One();

        // flip horizontally for GLTF right-handed coordinate system
        root.scaling.x *= -1;

        root.metadata = {
            id,
            name: title,
            type,
            subType,
            type3D,
            position,
            rotation,
            scale,
        } as StudioMeshMetaData;

        root.getChildMeshes().forEach((child) => {
            child.isPickable = false;
        });

        if (imageNameOrPath)
            this.setImageForAddedStudioObject(root, imageNameOrPath);

        root.getChildMeshes().forEach((mesh) => {
            if (noTextures) {
                mesh.material = this.scene.getMaterialByName("defaultMaterial");
            }
        });
        container.addAllToScene();
        this.atomObjects.push(root);

        return { root, container };
    }

    async loadStudioImageObject(
        object: StudioObject,
        quality: ObjectQualityWithNoTexture = "high",
        position?: ObjectTransform,
        rotation?: ObjectTransform,
        scale?: ObjectTransform
    ): Promise<Mesh | undefined> {
        const { id, path, title, type, subType } = object;

        const imagePath = `${path}/image_${quality}.jpg`;

        // load image from server (not pretty...)
        let res: Response | null = null;
        try {
            res = await fetch(imagePath);
            // eslint-disable-next-line
        } catch (e) {
            // empty
        }

        if (!res || !res.ok || res.status !== 200) {
            // try to load from the path without quality
            try {
                res = await fetch(`${path}/image.jpg`);
                // eslint-disable-next-line
            } catch (e) {
                // empty
            }
        }

        if (!res || !res.ok || res.status !== 200) {
            try {
                res = await fetch(`${path}/model.jpg`);
            } catch (e) {
                console.error("Error fetching image:", e);
            }
        }

        if (!res || !res.ok || res.status !== 200) {
            return;
        }

        const blob = await res.blob();

        // create image object to get image dimensions
        const image = new Image();
        image.src = URL.createObjectURL(blob);

        const mesh = CreatePlane(
            imagePath,
            {
                size: 1.3,
                sideOrientation: 2, // Mesh.DOUBLESIDE
            },
            this.scene
        );
        const material = new PBRMaterial(imagePath + "_material", this.scene);
        const texture = new Texture(
            URL.createObjectURL(blob),
            this.scene,
            true, // noMipmapOrOptions
            true, // invertY
            Texture.TRILINEAR_SAMPLINGMODE,
            undefined,
            undefined,
            blob,
            true
        );
        // flip texture horizontally
        texture.uScale = -1;

        material.albedoTexture = texture;

        material.metallic = 0.4;
        material.roughness = 0.85;
        material.albedoTexture.hasAlpha = true;
        material.useAlphaFromAlbedoTexture = true;
        material.albedoTexture.optimizeUVAllocation = true;
        material.albedoTexture.onDispose = () => {
            URL.revokeObjectURL(image.src);
        };
        mesh.material = material;

        image.onload = () => {
            material.freeze();
        };

        // update root mesh metadata to let application know
        // what object type it is to update correct gizmo axis
        mesh.metadata = {
            id,
            name: title,
            type,
            subType,
            type3D: "decoration",
            position,
            rotation,
            scale,
        } as StudioMeshMetaData;

        if (position) mesh.position = Vector3.FromArray(position);
        else mesh.position.setAll(0);

        mesh.rotationQuaternion = null;
        mesh.rotation = rotation ? Vector3.FromArray(rotation) : Vector3.Zero();
        mesh.scaling = scale ? Vector3.FromArray(scale) : Vector3.One();

        // don't comment this to utilize occlusion culling
        // mesh.freezeWorldMatrix();

        // don't use these to utilize frustum culling
        // mesh.doNotSyncBoundingInfo = true;
        // mesh.alwaysSelectAsActiveMesh = true;

        mesh.isPickable = false;
        mesh.occlusionType = 1; // AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
        mesh.occlusionQueryAlgorithmType = 1; // AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        mesh.isOccluded = false; // don't make object occluded by default

        this.atomObjects.push(mesh);

        return mesh;
    }

    cloneObject(
        metadata: StudioMeshMetaData,
        container: AssetContainer,
        position: ObjectTransform,
        rotation: ObjectTransform,
        scale: ObjectTransform,
        imageNameOrPath?: string
    ) {
        let newObject: Mesh;
        // don't instantiate objects with custom textures to use separate materials
        if (metadata.type === "images" || metadata.subType === "picture_frame") {
            newObject = container.meshes[0].clone(
                container.meshes[0].metadata.id +
                "_" +
                this._loadStep +
                "_" +
                this.atomObjects.length,
                null,
                false
            ) as Mesh;
        } else {
            // if object already exists in the scene, instantiate it for minimum draw calls
            const instancedContainer = container.instantiateModelsToScene(
                undefined,
                false,
                {
                    doNotInstantiate: false,
                }
            );
            newObject = instancedContainer.rootNodes[0] as Mesh;
        }

        newObject.metadata = { ...metadata };
        (newObject.metadata as StudioMeshMetaData).position = position;
        (newObject.metadata as StudioMeshMetaData).rotation = rotation;
        (newObject.metadata as StudioMeshMetaData).scale = scale;

        newObject.position = Vector3.FromArray(position);
        newObject.rotation = Vector3.FromArray(rotation);
        newObject.scaling = Vector3.FromArray(scale);

        // flip horizontally for GLTF right-handed coordinate system
        newObject.scaling.x *= -1;

        newObject.getChildMeshes().forEach((child) => {
            child.isPickable = false;
        });

        if (imageNameOrPath)
            this.setImageForAddedStudioObject(newObject, imageNameOrPath, true);

        this.atomObjects.push(newObject);

        return newObject;
    }

    setImageForAddedStudioObject(
        root: AbstractMesh,
        imageNameOrPath: string,
        newMaterial: boolean = false
    ) {
        const src = `/static/post/${imageNameOrPath}_resized.jpg`;
        this._addImageTextureToObject(root, src, newMaterial);
    }

    private async _addImageTextureToObject(
        root: AbstractMesh,
        src: string,
        newMaterial: boolean = false
    ) {
        return new Promise<void>((resolve) => {
            root.getChildMeshes().forEach((child) => {
                if (
                    !child.material ||
                    !(child.material instanceof PBRMaterial) ||
                    child.material.id !== "picture"
                ) {
                    return;
                }

                const texture = new Texture(src, this.scene, true, false);
                texture.optimizeUVAllocation = true;
                texture.isBlocking = false;

                let material: PBRMaterial;
                if (newMaterial) {
                    material = child.material.clone("picture_" + child.uniqueId);
                    child.material = material;
                } else {
                    material = child.material;
                }

                material.albedoTexture?.dispose();
                material.albedoTexture = texture;
                material.useAlphaFromAlbedoTexture = true; // use alpha channel from texture
                material.markDirty(true);

                if (texture.isReady()) {
                    resolve();
                } else {
                    texture.onLoadObservable.addOnce(() => {
                        resolve();
                    });
                }
            });
        });
    }

    storeNewObjectLOD(
        objectProperty: StudioDecorationObjectProperty,
        mesh: AbstractMesh,
        quality: ObjectQualityWithNoTexture,
        hideOldLOD: boolean = true
    ): void {
        const lodData = this._meshLODData.get(objectProperty);
        if (lodData) {
            lodData.lods[quality] = mesh;
            if (hideOldLOD && lodData.currentLOD) {
                const oldLOD = lodData.lods[lodData.currentLOD];
                if (oldLOD) {
                    oldLOD.setEnabled(false);
                    oldLOD.getChildMeshes().forEach((child) => child.setEnabled(false));
                }
            }
            lodData.currentLOD = quality;

            // since highest quality is loaded last, set it as current LOD
            if (quality === "high") {
                lodData.currentLOD = quality;
            }
        }
    }

    /** Load physics collisions for all studio objects in the scene */
    async loadCollisions() {
        if (this.isPhysicsGenerated === true) return;

        this.currentQualityObjects.forEach((object) => {
            const metadata = object.metadata as StudioMeshMetaData;
            if (metadata.type === "images") return;

            let shapeType = 6;
            if (metadata.subType === "picture_frame") {
                shapeType = 4;
            }
            this.generateCollision(object as Mesh, shapeType);
        });

        this.scene.onAfterPhysicsObservable.addOnce(() => {
            this.isPhysicsGenerated = true;
            eventBus.emit("space:physicsReady", this);
        });
    }

    generateCollision(
        root: Mesh,
        physicsShapeType: PhysicsShapeType = 6,
        useCachedShape: boolean = true
    ) {
        let shape;

        if (useCachedShape) {
            const cacheShapeParams =
                (root.metadata as StudioMeshMetaData).id +
                "_" +
                (root.metadata as StudioMeshMetaData).scale.map((num) => num).join("_");

            shape = this.objectPhysicsShape.get(cacheShapeParams);
            if (!shape) {
                const bbMinMax = root.getHierarchyBoundingVectors(true);
                const bbCenter = bbMinMax.min.add(bbMinMax.max).scale(0.5);
                shape = new PhysicsShape(
                    {
                        type: physicsShapeType,
                        parameters: {
                            mesh: root,
                            includeChildMeshes: true,
                            rotation: root.absoluteRotationQuaternion,
                            center: bbCenter, // to correctly position the shape
                        },
                    },
                    this.scene
                );
                shape.material = { friction: 0.6, restitution: 0 };
                shape.filterMembershipMask = PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT;
                this.objectPhysicsShape.set(cacheShapeParams, shape);

                // console.log('Generated physics shape for:', cacheShapeParams, shape);
                // } else {
                //     console.log(
                //         'Has physics shape from',
                //         root.metadata.name, (root.metadata as StudioMeshMetaData).scale.map(num => num).join('_'),
                //         ':',
                //         this.objectPhysicsShape.get(cacheShapeParams)
                //     );
            }
        } else {
            const bbMinMax = root.getHierarchyBoundingVectors(true);
            const bbCenter = bbMinMax.min.add(bbMinMax.max).scale(0.5);
            shape = new PhysicsShape(
                {
                    type: physicsShapeType,
                    parameters: {
                        mesh: root,
                        includeChildMeshes: true,
                        rotation: root.absoluteRotationQuaternion,
                        center: bbCenter, // to correctly position the shape
                    },
                },
                this.scene
            );
            shape.material = { friction: 0.6, restitution: 0 };
            shape.filterMembershipMask = PHYSICS_SHAPE_FILTER_GROUPS.ENVIRONMENT;
        }

        const body = new PhysicsBody(root, 0, true, this.scene);
        body.setMassProperties({ mass: 0 });
        body.shape = shape;

        // for debugging
        // this.physicsViewer.showBody(body);
    }

    private _getAsset(id: string): StudioObject | null {
        if (id in this.assets) return this.assets[id];
        return null;
    }

    dispose() {
        this.scene.blockfreeActiveMeshesAndRenderingGroups = true;
        this.currentQualityObjects = [];
        this.lodObjects = {};
        this.atomObjects.forEach((mesh) => {
            mesh.dispose(false, true);
        });
        this.scene.blockfreeActiveMeshesAndRenderingGroups = false;
    }
}
