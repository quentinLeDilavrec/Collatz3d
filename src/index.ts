import * as THREE from 'three'
import { hsl } from './hsl2rgb'
import * as OrbitControls from 'three-orbitcontrols'

type angle = degré | radian
type degré = number
type radian = number

interface OrbitControls {
    constructor(object: THREE.Camera, domElement?: HTMLElement): OrbitControls;

    object: THREE.Camera;
    domElement: HTMLElement;

    // API
    enabled: boolean;
    target: THREE.Vector3;

    // deprecated
    center: THREE.Vector3;

    enableZoom: boolean;
    zoomSpeed: number;
    minDistance: number;
    maxDistance: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableKeys: boolean;
    keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number; };
    mouseButtons: { ORBIT: THREE.MOUSE; ZOOM: THREE.MOUSE; PAN: THREE.MOUSE; };
    enableDamping: boolean;
    dampingFactor: number;


    rotateLeft(angle?: number): void;
    rotateUp(angle?: number): void;
    panLeft(distance?: number): void;
    panUp(distance?: number): void;
    pan(deltaX: number, deltaY: number): void;
    dollyIn(dollyScale: number): void;
    dollyOut(dollyScale: number): void;
    update(): void;
    reset(): void;
    getPolarAngle(): number;
    getAzimuthalAngle(): number;

    // EventDispatcher mixins
    addEventListener(type: string, listener: (event: any) => void): void;
    hasEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    dispatchEvent(event: { type: string; target: any; }): void;
}

const renderer = new THREE.WebGLRenderer(
    /*{ clearColor: 0x050505, clearAlpha: 1, antialias: true }//perf consuming*/
);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 100);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const scene = new THREE.Scene();

const materials = Array(100).fill(0).map(function (x, i) { return new THREE.LineBasicMaterial({ color: parseInt(hsl(10 + i * 1.5, 100, 50), 16) }) });


type CollatzLine = { n: number, c: THREE.Vector3, p: THREE.Vector3, d: number }

class Collatz {
    private start: [{ n: number, c: THREE.Vector3, p: THREE.Vector3, d: number }];
    private _d: number
    /**
     * 
     * @param startingNumber integer>=1 that is the first to pass in reverseCollatz / un entier >=1 pour le calcul de reverse collatz
     * @param startingPoint le point dans l'espace d'où l'abre commence
     * @param alpha starting angle in degre for the xy-axis / l'angle de départ en degré pour xy
     * @param beta starting angle in degre for the yz-axis / l'angle de départ en degré pour yz
     * @param d level of deterioration of first branche. Higher is more branches in the tree
     */
    constructor(startingNumber: number = 1, startingPoint: THREE.Vector3 = new THREE.Vector3(0, -25, 0), alpha: degré, beta: degré, d: number = 10) {
        let _a = alpha * Math.PI / 180
        let _b = beta * Math.PI / 180
        let c = startingPoint, long = 1
        this.start = [{
            n: startingNumber,
            c: startingPoint,
            p: new THREE.Vector3(c.x + long * Math.cos(_a) * Math.cos(_b), c.y + long * Math.sin(_a) * Math.cos(_b), c.z + long * Math.sin(_b)),
            d: d
        }];
        this._d = d / 10 * 4
    }

    private static collatzInv(x: number): { pair: number, impair?: number } {
        return (((2 * x - 1) % 3 != 0 || x == 2) ?
            { pair: 2 * x } :
            { pair: 2 * x, impair: (2 * x - 1) / 3 });
    }
    private static calcColPointBig(d: angle, long: number) {
        return function innner(a: angle, b: angle, c: THREE.Vector3, pair: boolean) {
            //d -= 0.00001; //d /= 1.0001
            //long /= 1.0001;
            return (pair) ?
                new THREE.Vector3(c.x + long * Math.cos(a + d), c.y + long * Math.sin(a + d), c.z + d * d * 11) :
                new THREE.Vector3(c.x + long * Math.cos(a - d * 1.5), c.y + long * Math.sin(a - d * 1.5), c.z /*- d*d*8*/);
            //new THREE.Vector3(c.x + long * Math.cos(a + d) * Math.cos(b + d), c.y + long * Math.sin(a + d) * Math.cos(b + d), c.z + long * Math.sin(b + d)) :
            //new THREE.Vector3(c.x + long * Math.cos(a - d*1.5) * Math.cos(b - d*1.5), c.y + long * Math.sin(a - d*1.5) * Math.cos(b - d*1.5), c.z + long * Math.sin(b - d*1.5));
        };
    }
    private static calcColPoint = Collatz.calcColPointBig(0.40, 1.5);


    private static collatzAff(x: CollatzLine): { pair: CollatzLine, impair?: CollatzLine } {
        var tmp = Collatz.collatzInv(x.n);
        var a = Math.atan2(x.c.y - x.p.y, x.c.x - x.p.x);
        var b = x.c.z - x.p.z//Math.atan2(x.c.z - x.p.z, x.c.y - x.p.y);
        return (tmp.impair == undefined) ?
            { pair: { n: tmp.pair, p: x.c, c: Collatz.calcColPoint(a, b, x.c, true), d: x.d - 2.4 } } :
            {
                pair: { n: tmp.pair, p: x.c, c: Collatz.calcColPoint(a, b, x.c, true), d: (x.d <= 4) ? x.d + 0.4 : 4 },
                impair: { n: tmp.impair, p: x.c, c: Collatz.calcColPoint(a, b, x.c, false), d: 4 }
            };
    }

    public generate3d(l = 60) {
        let geometries: THREE.Geometry[] = []

        function aff(x: CollatzLine[], l: number) {
            if (l > 0) {

                var r = x.map(x =>
                    (0 >= x.d) ?
                        [] :
                        (
                            x => (x.impair == undefined) ?
                                [x.pair] :
                                [x.pair, x.impair]
                        )(Collatz.collatzAff(x))
                ).reduce((acc, x) => acc.concat(x), []);


                geometries.push(
                    (
                        x => { var a = new THREE.Geometry(); a.vertices = x; return a }
                    )(r.reduce((acc, x) => { acc.push(x.p); acc.push(x.c); return acc; }, [] as THREE.Vector3[])));


                aff(r, l - 1);

            }
        }

        aff(this.start, l)
        return geometries

    }
}

let lines: THREE.LineSegments[] = new Collatz(undefined, undefined, 0, 0).generate3d().map(function (x, i) { return new THREE.LineSegments(x, materials[i % 100]); });
//geometries.map(function (x, i) { return new THREE.LineSegments(x, materials[i % 100]); });
const render = function () {
    requestAnimationFrame(render);
    lines.map(function (x) { scene.add(x); });

    renderer.render(scene, camera);
};
render()
