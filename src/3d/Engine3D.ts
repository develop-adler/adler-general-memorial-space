import { Engine } from "@babylonjs/core/Engines/engine";
import { DracoCompression } from "@babylonjs/core/Meshes/Compression/dracoCompression";
import { KhronosTextureContainer2 } from "@babylonjs/core/Misc/khronosTextureContainer2";
import { Logger } from "@babylonjs/core/Misc/logger";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import HavokPhysics from "@babylonjs/havok";

import eventBus from "@/eventBus";

import type { HavokPhysicsWithBindings } from "@babylonjs/havok";

registerBuiltInLoaders();

export class Engine3D {
    readonly canvas: HTMLCanvasElement;
    readonly engine: Engine;
    havok?: HavokPhysicsWithBindings;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(canvas, true);
        this._setBabylonJSDefaults();
        this._initHavok();
    }

    private _initHavok() {
        HavokPhysics().then(havok => {
            this.havok = havok;
            eventBus.emit('havok:ready', havok);
        });
    }

    private _setBabylonJSDefaults(): void {
        Logger.LogLevels = Logger.NoneLogLevel;

        KhronosTextureContainer2.URLConfig = {
            jsDecoderModule: "/babylonjs/ktx2/babylon.ktx2Decoder.js",
            jsMSCTranscoder: "/babylonjs/ktx2/transcoder/msc_basis_transcoder.js",
            wasmMSCTranscoder: "/babylonjs/ktx2/transcoder/msc_basis_transcoder.wasm",
            wasmUASTCToASTC: "/babylonjs/ktx2/transcoder/uastc_astc.wasm",
            wasmUASTCToBC7: "/babylonjs/ktx2/transcoder/uastc_bc7.wasm",
            wasmUASTCToRGBA_SRGB:
                "/babylonjs/ktx2/transcoder/uastc_rgba8_srgb_v2.wasm",
            wasmUASTCToRGBA_UNORM:
                "/babylonjs/ktx2/transcoder/uastc_rgba8_unorm_v2.wasm",
            wasmZSTDDecoder: "/babylonjs/ktx2/transcoder/zstddec.wasm",
            wasmUASTCToR8_UNORM: "/babylonjs/ktx2/transcoder/uastc_r8_unorm.wasm",
            wasmUASTCToRG8_UNORM: "/babylonjs/ktx2/transcoder/uastc_rg8_unorm.wasm",
        };

        DracoCompression.Configuration = {
            decoder: {
                wasmUrl: "/babylonjs/draco/draco_wasm_wrapper_gltf.js",
                wasmBinaryUrl: "/babylonjs/draco/draco_decoder_gltf.wasm",
                fallbackUrl: "/babylonjs/draco/draco_decoder_gltf.js",
            },
        };
    }
    resize(): void {
        this.engine.resize();
        this.engine.setHardwareScalingLevel(0.5);
    }
    dispose() {
        this.engine.dispose();
    }
}
