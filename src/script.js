import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { Scene } from 'three'

// Debug
const gui = new dat.GUI()

// Functions
function distToOrigin([x, y, z]){
    return Math.sqrt(x * x + y * y + z * z)
}

function getCoord(){
    let coord = [0, 0, 0]
    while(distToOrigin(coord) < 200){
        for (let i = 0;i < 3;i++) {
            coord[i] = THREE.MathUtils.randFloat(-500, 500);   
        }
    }
    return coord
}

function addStar(){
    const starGeometry = new THREE.SphereGeometry(.5, 10, 10)
    const starColors = [
        new THREE.MeshBasicMaterial({color: 0xB5CDFF}), // 25000 k (Rigel, Spica, Bellatrix)
        new THREE.MeshBasicMaterial({color: 0xCADAFF}), // 10000 k (Sirius, Vega)
        new THREE.MeshBasicMaterial({color: 0xFFF6ED}), // 6000 k (Proxima, the Sun)
        new THREE.MeshBasicMaterial({color: 0xFFCEA6}), // 4000 k (Aldebaran, Arcturus)
        new THREE.MeshBasicMaterial({color: 0xFFB16E}) // 3000 k (	Antares, Betelgeuse)
    ]
    const starMaterial = starColors[THREE.MathUtils.randInt(0, starColors.length)]
    const star = new THREE.Mesh(starGeometry, starMaterial)

    const [x, y, z] = getCoord()
    star.position.set(x, y, z)
    scene.add(star)
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Helpers
const gridHelper = new THREE.GridHelper(200, 75)
// scene.add(gridHelper)

// Textures
const textureLoader = new THREE.TextureLoader()
const spaceTexture = textureLoader.load('/textures/space.jpg')
const earthTexture = textureLoader.load('/textures/earth_daymap.jpg')
const earthNormalMap = textureLoader.load('/textures/earth_normal_map.jpg')
const sunTexture = textureLoader.load('/textures/sun.jpg')
// scene.background = spaceTexture

// Objects
const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
const orbitGeometry = new THREE.TorusGeometry(100, 0.1, 2, 200)

// Materials
const earthMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffffff), 
    map: earthTexture,
    normalMap: earthNormalMap
})

const sunMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffffff),
    map: sunTexture
})

const orbitMaterial = new THREE.MeshBasicMaterial({
    color : new THREE.Color(0xffffff)
})

// Mesh
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
earth.position.set(100, 0, 0)
scene.add(earth)

const sun = new THREE.Mesh(sunGeometry, sunMaterial)
scene.add(sun)

const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial)
orbit.rotation.x = Math.PI / 2 
scene.add(orbit)

Array(2000).fill().forEach(addStar) // stars

// Lights
const ambientLight = new THREE.AmbientLight({
    color: new THREE.Color(0xffffff)
})
// scene.add(ambientLight)

const sunLight = new THREE.PointLight(0xffffff, 2)
const sunLightHelper = new THREE.PointLightHelper(sunLight)
scene.add(sunLightHelper)
scene.add(sunLight)

// scene.add(sunLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(window.devicePixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(0, 0, -120)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)

/**
 * Animate
 */

const clock = new THREE.Clock()
let rotationTimes = {earthRotationRate: 0.5, trasnlationsPerSecond: 0.01}
let cameraViews = {
    view: "You",
    sunView: false,
    earthView: false,
    cameraHeight: 128
}
gui.add(rotationTimes, 'earthRotationRate').min(0.5).max(30).step(0.1)
gui.add(rotationTimes, 'trasnlationsPerSecond').min(0.01).max(1).step(0.01)
gui.add(cameraViews, 'view', ['You', 'Sun', 'Earth'])
gui.add(cameraViews, 'cameraHeight').min(10).max(300).step(2)

let earthAngle = 0
let lastTime = 0
const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastTime
    lastTime = clock.getElapsedTime()

    // Update objects
    const earthOrbit = 100
    // const earthAngle = ((rotationTimes.trasnlationsPerSecond * elapsedTime) % 360) * Math.PI / 180 // in radians
    earthAngle += (deltaTime * rotationTimes.trasnlationsPerSecond * Math.PI * 2)
    const xEarthPosition = earthOrbit * Math.cos(earthAngle)
    const zEarthPosition = earthOrbit * Math.sin(earthAngle)

    earth.rotation.y = rotationTimes.earthRotationRate * elapsedTime
    earth.position.x = xEarthPosition
    earth.position.z = zEarthPosition

    sun.rotation.y = -.1 * elapsedTime

    if(cameraViews.view == "Earth"){
        camera.position.set(earth.position.x, cameraViews.cameraHeight, earth.position.z)
        camera.rotation.set(-Math.PI / 2, 0, 0)
        controls.target.set(earth.position.x, earth.position.y, earth.position.z)
        controls.enabled = false
    }
    if(cameraViews.view == "Sun"){
        camera.position.set(0, cameraViews.cameraHeight, 0)
        camera.rotation.set(-Math.PI / 2, 0, 0)
        controls.target.set(0, 0, 0)
        controls.enabled = false
    }
    if(cameraViews.view == "You"){
        controls.enabled = true
        controls.update()
    }

    // Update Orbital Controls


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    // Debugging
    // console.log(camera.rotation)
}

tick()