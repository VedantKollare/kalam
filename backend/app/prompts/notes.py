# Prompt kept separate from code so it can be tuned without touching logic.
#
# Scripter's AI is a script consultant, not a co-writer: it gives notes and
# the writer decides what to change. It must never write replacement lines.

SYSTEM_PROMPT = '''You are an experienced script consultant giving notes to a screenwriter.
You give recommendations only. You NEVER rewrite the writer's lines, never write new
dialogue or action, and never quote a "better version". Describe the problem and why
it matters; the writer will decide how to fix it.
Respect the script's language and cultural context (Indian cinema conventions such as
songs and an interval are normal, not errors).
Reply with JSON only.'''

USER_TEMPLATE = '''Script language: {language}
{focus_line}
Here is one scene. Each line starts with its id and element type.

{scene}

Give at most {max_notes} specific, useful notes. Skip anything that is already working.
Return JSON exactly in this shape:
{{"notes": [{{"block_id": "<id of the line the note is about, or null for the whole scene>",
  "category": "structure|character|dialogue|pacing|clarity|continuity|format",
  "note": "<the recommendation, 1-3 sentences, no rewritten lines>"}}]}}'''


PROOFREAD_SYSTEM_PROMPT = '''You are a careful proofreader for screenplays.
Point out spelling, grammar and punctuation mistakes. You do not rewrite lines or
suggest new wording; you name the mistake precisely (quote the wrong word or phrase
and say what is wrong with it) so the writer can fix it.
ACTION lines should be correct written English.
DIALOGUE is how a character speaks: slang, Hinglish, fragments and non-standard
grammar are deliberate. In dialogue flag only clear typos and misspellings.
Ignore scene headings, character names and formatting.
Reply with JSON only.'''

PROOFREAD_TEMPLATE = '''Script language: {language}
Each line starts with its id and element type.

{scene}

List at most {max_notes} real mistakes. If there are none, return an empty list.
Return JSON exactly in this shape:
{{"notes": [{{"block_id": "<id of the line>", "category": "grammar",
  "note": "<quote the mistake and say what is wrong, 1 sentence>"}}]}}'''


def _scene_text(scene_lines: list[tuple[str, str, str]]) -> str:
    return '\n'.join(f'[{bid}] {btype.upper()}: {text}' for bid, btype, text in scene_lines)


def build_proofread_messages(scene_lines: list[tuple[str, str, str]], language: str, max_notes: int) -> list[dict]:
    user = PROOFREAD_TEMPLATE.format(language=language, scene=_scene_text(scene_lines), max_notes=max_notes)
    return [
        {'role': 'system', 'content': PROOFREAD_SYSTEM_PROMPT},
        {'role': 'user', 'content': user},
    ]


def build_notes_messages(scene_lines: list[tuple[str, str, str]], language: str,
                         focus: list[str], max_notes: int) -> list[dict]:
    scene = _scene_text(scene_lines)
    focus_line = f'Focus on: {", ".join(focus)}.' if focus else 'Cover whatever matters most.'
    user = USER_TEMPLATE.format(language=language, focus_line=focus_line, scene=scene, max_notes=max_notes)
    return [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': user},
    ]
