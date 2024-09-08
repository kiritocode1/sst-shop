"use client";
import { FC, useRef, useEffect } from "react";

type particles = {
	x: number;
	y: number;
	baseX: number;
	baseY: number;
	vx: number;
	vy: number;
};

interface CarpediemProps {
    words? : string[]
}

const Carpediem: FC<CarpediemProps> = ({words}) => {
	const canvas = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
        let CurrentCanvas = canvas.current;
        if (!CurrentCanvas) return;
		const gl = CurrentCanvas?.getContext("webgl");
		if (!CurrentCanvas || !gl) return;
		CurrentCanvas.width = window.innerWidth;
		CurrentCanvas.height = window.innerHeight;
		gl.viewport(0, 0, CurrentCanvas.width, CurrentCanvas.height);

		const config = {
			particleCount: 8000,
			textArray: words??["npm i sst", "sst.dev", "ssh terminal.shop"],
			mouseRadius: 0.1,
			particleSize: 2,
			forceMultiplier: 0.001,
			returnSpeed: 0.005,
			velocityDamping: 0.95,
			colorMultiplier: 40000,
			saturationMultiplier: 1000,
			textChangeInterval: 5000,
			rotationForceMultiplier: 0.5,
		};
		let currentTextIndex = 0;
		let nextTextTimeout;
		let textCoordinates : { x: number, y: number }[] = [];

		const mouse = {
			x: -500,
			y: -500,
			radius: config.mouseRadius,
		};

		const particles: particles[] = [];
		for (let i = 0; i < config.particleCount; i++) {
			particles.push({ x: 0, y: 0, baseX: 0, baseY: 0, vx: 0, vy: 0 });
		}

		const vertexShaderSource = `
    attribute vec2 a_position;
    attribute float a_hue;
    attribute float a_saturation;
    varying float v_hue;
    varying float v_saturation;
    void main() {
        gl_PointSize = ${config.particleSize.toFixed(1)};
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_hue = a_hue;
        v_saturation = a_saturation;
    }
`;
		const fragmentShaderSource = `
    precision mediump float;
    varying float v_hue;
    varying float v_saturation;
    void main() {
        float c = v_hue * 6.0;
        float x = 1.0 - abs(mod(c, 2.0) - 1.0);
        vec3 color;
        if (c < 1.0) color = vec3(1.0, x, 0.0);
        else if (c < 2.0) color = vec3(x, 1.0, 0.0);
        else if (c < 3.0) color = vec3(0.0, 1.0, x);
        else if (c < 4.0) color = vec3(0.0, x, 1.0);
        else if (c < 5.0) color = vec3(x, 0.0, 1.0);
        else color = vec3(1.0, 0.0, x);
        vec3 finalColor = mix(vec3(1.0), color, v_saturation);
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

		function createShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
			const shader = gl.createShader(type) as WebGLShader;
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return null;
			}
			return shader;
		}

		function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
			const program = gl.createProgram() as WebGLProgram;
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.error(gl.getProgramInfoLog(program));
				gl.deleteProgram(program);
				return null;
			}
			return program;
		}

		const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = createProgram(gl, vertexShader as WebGLShader, fragmentShader as WebGLShader);
        
const positionAttributeLocation = gl.getAttribLocation(program as WebGLProgram, "a_position");
const hueAttributeLocation = gl.getAttribLocation(program as WebGLProgram, "a_hue");
const saturationAttributeLocation = gl.getAttribLocation(program as WebGLProgram, "a_saturation");

const positionBuffer = gl.createBuffer();
const hueBuffer = gl.createBuffer();
const saturationBuffer = gl.createBuffer();


const positions = new Float32Array(config.particleCount * 2);
const hues = new Float32Array(config.particleCount);
const saturations = new Float32Array(config.particleCount);

function getTextCoordinates(text: string) {
    const ctx = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
    if (!ctx || !CurrentCanvas) return;

	ctx.canvas.width = CurrentCanvas.width;
	ctx.canvas.height = CurrentCanvas.height;
	const fontSize = Math.min(CurrentCanvas.width / 6, CurrentCanvas.height / 6);
	ctx.font = `900 ${fontSize}px Arial`;
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(text, CurrentCanvas.width / 2, CurrentCanvas.height / 2);
	const imageData = ctx.getImageData(0, 0, CurrentCanvas.width, CurrentCanvas.height).data;
	const coordinates = [];
	for (let y = 0; y < CurrentCanvas.height; y += 4) {
		for (let x = 0; x < CurrentCanvas.width; x += 4) {
			const index = (y * CurrentCanvas.width + x) * 4;
			if (imageData[index + 3] > 128) {
				coordinates.push({
					x: (x / CurrentCanvas.width) * 2 - 1,
					y: (y / CurrentCanvas.height) * -2 + 1,
				});
			}
		}
	}
	return coordinates;
}

        
        function createParticles() {
    
	textCoordinates = getTextCoordinates(config.textArray[currentTextIndex]) as { x: number, y: number }[];
	for (let i = 0; i < config.particleCount; i++) {
		const randomIndex = Math.floor(Math.random() * textCoordinates.length);
		const { x, y } = textCoordinates[randomIndex];
		particles[i].x = particles[i].baseX = x;
		particles[i].y = particles[i].baseY = y;
	}
}
function updateParticles() {
	for (let i = 0; i < config.particleCount; i++) {
		const particle = particles[i];
		const dx = mouse.x - particle.x;
		const dy = mouse.y - particle.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const forceDirectionX = dx / distance;
		const forceDirectionY = dy / distance;
		const maxDistance = mouse.radius;
		const force = (maxDistance - distance) / maxDistance;
		const directionX = forceDirectionX * force * config.forceMultiplier;
		const directionY = forceDirectionY * force * config.forceMultiplier;

		const angle = Math.atan2(dy, dx);

		const rotationForceX = Math.sin(-Math.cos(angle * -1) * Math.sin(config.rotationForceMultiplier * Math.cos(force)) * Math.sin(distance * distance) * Math.sin(angle * distance));

		const rotationForceY = Math.sin(Math.cos(angle * 1) * Math.sin(config.rotationForceMultiplier * Math.sin(force)) * Math.sin(distance * distance) * Math.cos(angle * distance));

		if (distance < mouse.radius) {
			particle.vx -= directionX + rotationForceX;
			particle.vy -= directionY + rotationForceY;
		} else {
			particle.vx += (particle.baseX - particle.x) * config.returnSpeed;
			particle.vy += (particle.baseY - particle.y) * config.returnSpeed;
		}

		particle.x += particle.vx;
		particle.y += particle.vy;
		particle.vx *= config.velocityDamping;
		particle.vy *= config.velocityDamping;

		const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
		const hue = (speed * config.colorMultiplier) % 360;

		hues[i] = hue / 360;
		saturations[i] = Math.min(speed * config.saturationMultiplier, 1);
		positions[i * 2] = particle.x;
		positions[i * 2 + 1] = particle.y;
    }
    if (!gl) return;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, hueBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, hues, gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, saturationBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, saturations, gl.DYNAMIC_DRAW);
}


function animate() {
    updateParticles();
    if (!gl) return;
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, hueBuffer);
	gl.vertexAttribPointer(hueAttributeLocation, 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(hueAttributeLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, saturationBuffer);
	gl.vertexAttribPointer(saturationAttributeLocation, 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(saturationAttributeLocation);
	gl.useProgram(program);
	gl.drawArrays(gl.POINTS, 0, config.particleCount);
	requestAnimationFrame(animate);
}
        CurrentCanvas.addEventListener("mousemove", (event) => {
            mouse.x = (event.clientX / CurrentCanvas.width) * 2 - 1;
			mouse.y = (event.clientY / CurrentCanvas.height) * -2 + 1;
        });

        
CurrentCanvas.addEventListener("mouseleave", () => {
	mouse.x = -500;
	mouse.y = -500;
});
        
        window.addEventListener("resize", () => {
			CurrentCanvas.width = window.innerWidth;
			CurrentCanvas.height = window.innerHeight;
			gl.viewport(0, 0, CurrentCanvas.width, CurrentCanvas.height);
			createParticles();
		});


        
function changeText() {
	currentTextIndex = (currentTextIndex + 1) % config.textArray.length;
	const newCoordinates = getTextCoordinates(config.textArray[currentTextIndex]);
    for (let i = 0; i < config.particleCount; i++) {
        if (!newCoordinates ) return;
		const randomIndex = Math.floor(Math.random() * newCoordinates.length);
		const { x, y } = newCoordinates[randomIndex];
		particles[i].baseX = x;
		particles[i].baseY = y;
	}
	nextTextTimeout = setTimeout(changeText, config.textChangeInterval);
}

        
gl.clearColor(0, 0, 0, 1);
createParticles();
animate();
nextTextTimeout = setTimeout(changeText, config.textChangeInterval);

        
	}, []);

	return (
		<div className="w-screen h-[100dvh] grid place-items-center bg-[#222] ">
			<canvas
				ref={canvas}
				className="w-screen h-screen fixed"
			></canvas>
		</div>
	);
};

export default Carpediem;
