import * as THREE from 'three';
import TweenMax from "gsap";
import OrbitContructor from 'three-orbit-controls';
import Stats from 'stats.js';
import dat from 'dat-gui';

import './postprocessing/EffectComposer';
import './postprocessing/RenderPass';
import './postprocessing/ShaderPass';

import './shaders/CopyShader';
import './shaders/FXAAShader';
import './shaders/HorizontalTiltShiftShader';
import './shaders/VerticalTiltShiftShader';

import './shaders/ScreenShader';

import './MarchingCubes';
// import './ShaderToon';

const glslify = require('glslify');
const OrbitControls = OrbitContructor(THREE);


let That;
let time = 0;
let clock = new THREE.Clock();


class Scene {

	constructor() {
		That = this;

		this.start();
	}

	start() {
		this.stats = new Stats();
		document.body.appendChild(this.stats.dom);

		this.camera;
		this.scene;
		this.groundMaterial;
		this.mesh;

		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 50000);
		this.camera.position.set(0, 0, 500);
		this.scene = new THREE.Scene();
		this.scene.add(this.camera);


		// init renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			autoClearColor: true
		});
		this.renderer.setClearColor(0x333333);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;


		// controls
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.update();


		this.initCubes();
		// this.initEffectComposer();


		this.animate();
	}


	initCubes()
	{
		// MARCHING CUBES
		let path = "assets/pisa/";
		let format = '.png';
		let urls = [
			path + 'px' + format, path + 'nx' + format,
			path + 'py' + format, path + 'ny' + format,
			path + 'pz' + format, path + 'nz' + format
		];
		let cubeTextureLoader = new THREE.CubeTextureLoader();
		let reflectionCube = cubeTextureLoader.load(urls);
		reflectionCube.format = THREE.RGBFormat;

		let material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			envMap: reflectionCube,
			roughness: 0.1,
			metalness: 1.0,
			side:THREE.FrontSide
			// side:THREE.DoubleSide
			// side:THREE.BackSide

		})

		this.effect = new THREE.MarchingCubes(28, material, true, true);
		this.effect.position.set(0, 0, 0);
		this.effect.scale.set(100, 100, 100);

		this.effect.enableUvs = false;
		this.effect.enableColors = false;
		this.scene.add(this.effect);
	}

	updateCubes(object, time) {
		object.reset();


		var numblobs = 10;

		// fill the field with some metaballs
		var i, ballx, bally, ballz, subtract, strength;

		subtract = 12;
		strength = 1.2 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

		for (i = 0; i < numblobs; i++) {

			ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
			bally = Math.abs(Math.cos(i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * 0.77; // dip into the floor
			ballz = Math.cos(i + 1.32 * time * 0.1 * Math.sin((0.92 + 0.53 * i))) * 0.27 + 0.5;

			object.addBall(ballx, bally, ballz, strength, subtract);

		}

		// object.addPlaneY(2, 12);
		// object.addPlaneX(2, 12);
	}




	initEffectComposer() {
		this.composer = new THREE.EffectComposer(this.renderer);
		this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

		//扛锯齿
		var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
		effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
		this.composer.addPass(effectFXAA);


		var effect2 = new THREE.ShaderPass(THREE.ScreenShader);
		effect2.renderToScreen = true;
		this.composer.addPass(effect2);

	}


	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.render();

		if (That.mesh) That.mesh.rotateY(.006);



	}


	// main animation loop
	render(dt) {
		var delta = clock.getDelta();
		time += delta;

		if(this.effect)this.updateCubes(this.effect, time);

		if (this.stats) this.stats.update();
		this.renderer.render(this.scene, this.camera);

		if (this.composer) {
			this.composer.render();
		}
		
	}
}


export {
	Scene
};