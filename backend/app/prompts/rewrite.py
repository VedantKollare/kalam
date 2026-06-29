PROMPT_TEMPLATE = '''You are an expert screenplay editor.
Rewrite the following screenplay block while preserving its element type and the original language.
Keep the result concise, cinematic, and appropriate for a screenplay.
Do not invent new characters, scene headings, or directions.

Element type: {element_type}
Original block:
{text}

Instruction: {instruction}

Rewrite the block only.
'''


def build_rewrite_prompt(text: str, element_type: str, instruction: str | None = None) -> str:
    instruction_text = instruction.strip() if instruction and instruction.strip() else 'Improve the writing while preserving meaning.'
    return PROMPT_TEMPLATE.format(
        text=text.strip(),
        element_type=element_type,
        instruction=instruction_text,
    )
