import { NarrativeRegistry } from '../narrative';
import type { NarrativeContent } from '../narrative';
import { narrativeContent } from './narrativeTestFixture';

describe('NarrativeRegistry', () => {
  it('registers and returns immutable defensive copies', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    const registry = new NarrativeRegistry();
    expect(registry.register(content as NarrativeContent)).toEqual({ ok: true, value: undefined });

    content.dialogues[0].nodes[0].text = 'Changed outside';
    content.missions[0].objectives[0].target = 999;

    const dialogue = registry.getDialogue('test.welcome')!;
    expect(dialogue.nodes[0].text).toBe('Choose a path.');
    expect(registry.getMission('test.hunt')?.objectives[0].target).toBe(2);
    expect(Object.isFrozen(dialogue)).toBe(true);
    expect(Object.isFrozen(dialogue.nodes)).toBe(true);
    expect(Object.isFrozen(dialogue.nodes[0].choices)).toBe(true);
    expect(Object.isFrozen(registry.listMissions())).toBe(true);
  });

  it('rejects duplicate ids atomically', () => {
    const content = narrativeContent();
    const registry = new NarrativeRegistry();
    const duplicate = {
      ...content,
      stageId: 'test.other-stage',
      dialogues: [content.dialogues![0]],
      npcs: [], missions: [], events: [],
      definition: {},
    };

    expect(registry.register(content).ok).toBe(true);
    const result = registry.register(duplicate);
    expect(result).toMatchObject({ ok: false, error: { code: 'duplicate-id' } });
    expect(registry.getDefinition('test.other-stage')).toBeUndefined();
    expect(registry.listDialogues()).toHaveLength(1);
  });

  it('diagnoses missing references, incompatible filters and unknown commands', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.definition.entryDialogueId = 'missing.dialogue';
    content.npcs[0].interactionDialogueId = 'missing.dialogue';
    content.events[0].filter = { field: 'enemyId', equals: 'x' };
    content.events[0].commands = [{ type: 'execute', code: 'anything' }];

    const result = new NarrativeRegistry().register(content as NarrativeContent);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'narrative.entry-dialogue.missing',
      'narrative.npc.dialogue.missing',
      'narrative.filter.field.invalid',
      'narrative.command.unknown',
    ]));
  });

  it('rejects automatic dialogue cycles and missing terminations', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.dialogues[0].nodes = [
      { id: 'a', speakerId: 'narrator', text: 'A', nextNodeId: 'b' },
      { id: 'b', speakerId: 'narrator', text: 'B', nextNodeId: 'a' },
    ];
    content.dialogues[0].startNodeId = 'a';

    const result = new NarrativeRegistry().register(content as NarrativeContent);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'narrative.dialogue.automatic-cycle',
      'narrative.dialogue.termination.missing',
    ]));
  });

  it('rejects non-declarative callbacks even on otherwise known commands', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.events[0].commands[0].callback = () => undefined;

    const result = new NarrativeRegistry().register(content as NarrativeContent);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics).toContainEqual(expect.objectContaining({
      code: 'narrative.value.non-declarative',
    }));
  });

  it('accepts choice cycles only when a terminal path remains available', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.dialogues[0] = {
      id: 'test.welcome',
      startNodeId: 'loop',
      nodes: [
        { id: 'loop', speakerId: 'narrator', text: 'Loop?', choices: [
          { id: 'again', text: 'Again', nextNodeId: 'loop' },
          { id: 'leave', text: 'Leave', nextNodeId: 'end' },
        ] },
        { id: 'end', speakerId: 'narrator', text: 'Done.' },
      ],
    };
    expect(new NarrativeRegistry().register(content as NarrativeContent).ok).toBe(true);
  });

  it('rejects a choice branch trapped in a cycle even when another branch terminates', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.dialogues[0] = {
      id: 'test.welcome',
      startNodeId: 'start',
      nodes: [
        { id: 'start', speakerId: 'narrator', text: 'Choose.', choices: [
          { id: 'trap', text: 'Trap', nextNodeId: 'loop' },
          { id: 'leave', text: 'Leave', nextNodeId: 'end' },
        ] },
        { id: 'loop', speakerId: 'narrator', text: 'Again?', choices: [
          { id: 'again', text: 'Again', nextNodeId: 'loop' },
        ] },
        { id: 'end', speakerId: 'narrator', text: 'Done.' },
      ],
    };
    const result = new NarrativeRegistry().register(content as NarrativeContent);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics).toContainEqual(expect.objectContaining({
      code: 'narrative.dialogue.trap-cycle', referenceId: 'loop',
    }));
  });
});
