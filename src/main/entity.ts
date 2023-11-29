export class Entity extends g.FilledRect {

    private static readonly MAX_OBJECT_NUMBER = 64 * 4;
    private static readonly OBJECT_SIZE = 8 * 4;
    private static readonly PI2 = 2 * Math.PI;

    constructor(scene: g.Scene) {
        super({
            scene: scene,
            width: Entity.OBJECT_SIZE,
            height: Entity.OBJECT_SIZE,
            cssColor: "white",
            opacity: 0.5,
            anchorX: 0.5,
            anchorY: 0.5,
            x: g.game.width / 2,
            y: g.game.height / 2,
        });
    }

    generateGradientColor = (value: number): string => {
        const startColor: number[] = [0, 64, 255];
        const endColor: number[] = [255, 32, 0];
        const r = Math.round((1 - value) * startColor[0] + value * endColor[0]);
        const g = Math.round((1 - value) * startColor[1] + value * endColor[1]);
        const b = Math.round((1 - value) * startColor[2] + value * endColor[2]);
        return `rgb(${r},${g},${b})`;
    };
}