export class Entity extends g.FilledRect {

    private static readonly OBJECT_SIZE = 8 * 4;

    constructor(scene: g.Scene) {
        super({
            scene: scene,
            width: Entity.OBJECT_SIZE,
            height: Entity.OBJECT_SIZE,
            cssColor: "white",
            opacity: 0,
            anchorX: 0.5,
            anchorY: 0.5,
            x: g.game.width / 2,
            y: g.game.height / 2,
        });
    }
}