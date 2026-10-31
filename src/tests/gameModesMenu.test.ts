import { readFileSync } from 'fs';
import { join } from 'path';

function source(...parts: readonly string[]): string {
  return readFileSync(join(__dirname, '..', ...parts), 'utf8');
}

/**
 * The Phaser scenes are thin renderers over the headless GameSessionService.
 * Node has no canvas, so these tests assert the wiring and dependency direction
 * instead of pretending to click a canvas.
 */
describe('Game mode menu wiring', () => {
  const menu = source('scenes', 'MenuScene.ts');
  const modes = source('scenes', 'GameModesScene.ts');
  const game = source('scenes', 'GameScene.ts');
  const main = source('main.ts');

  it('routes the main menu to the game modes scene and registers it', () => {
    expect(menu).toContain("this.scene.start('GameModesScene')");
    expect(main).toContain("import { GameModesScene } from './scenes/GameModesScene'");
    expect(main).toContain('GameModesScene');
  });

  it('starts classic, composed and individual sessions through the existing scene', () => {
    expect(modes).toContain("this.scene.start('GameScene', { macroCampaign: true })");
    expect(modes).toContain("this.scene.start('GameScene', { campaignRuntime: runtime })");
    expect(modes).toContain("this.scene.start('GameScene', {");
    expect(modes).toContain('individualRuntime');
    expect(modes).toContain("this.scene.start('MenuScene')");
  });

  it('delegates validation to the session service instead of composing in the scene', () => {
    expect(modes).toContain('new GameSessionService');
    expect(modes).toContain('startRandomCampaign');
    expect(modes).toContain('startCustomCampaign');
    expect(modes).toContain('startIndividualStage');
    expect(modes).not.toMatch(/CampaignCompositionService|CampaignGraphGenerator|CampaignRouter|StageLoader/);
  });

  it('prefills the custom slots from a saved composed run', () => {
    expect(modes).toContain('savedCampaign?.assignments');
    expect(modes).toContain('this.customSelections.set(assignment.slotId, assignment.stageId)');
  });

  it('runs individual stages with isolated memory progression and no campaign router', () => {
    expect(game).toContain('individualRuntime?: GameSceneIndividualRuntime');
    expect(game).toContain('new ProgressionService({ storage: new MemoryProgressionStorage() })');
    expect(game).toContain('this.campaignRouter = undefined');
  });

  it('keeps the classic macro entry point available', () => {
    expect(game).toContain("data?.macroCampaign === true");
    expect(game).toContain('configureMacroCampaign()');
  });
});
