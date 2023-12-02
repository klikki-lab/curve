import { MainScene } from "./main/mainScene";
import { GameMainParameterObject } from "./parameterObject";

export function main(param: GameMainParameterObject): void {
	g.game.vars.version = "0.3.1";//バージョン更新忘れずに!!
	g.game.pushScene(new MainScene(param));
}
