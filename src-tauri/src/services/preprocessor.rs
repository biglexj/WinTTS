use regex::Regex;
use std::sync::LazyLock;

static FENCED_CODE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)```.*?```").unwrap());
static HTML_COMMENT_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<!--.*?-->").unwrap());
static IMAGE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"!\[[^\]]*\]\([^)]*\)").unwrap());
static LINK_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\[([^\]]+)\]\([^)]*\)").unwrap());
static INLINE_CODE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"`([^`]+)`").unwrap());
static HTML_TAG_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"<[^>]+>").unwrap());
static HEADER_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?m)^\s{0,3}#{1,6}\s+").unwrap());
static HASHTAG_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?:^|\s)#+([a-zA-Z0-9_]+)").unwrap());
static BLOCKQUOTE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?m)^\s{0,3}>\s?").unwrap());
static LIST_MARKER_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?m)^\s*(?:[-+*]|\d+[.)])\s+").unwrap());
static HORIZONTAL_RULE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?m)^\s{0,3}(?:[-*_]\s*){3,}$").unwrap());
static STRONG_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(\*\*|__)(.+?)(\*\*|__)").unwrap());
static STRIKETHROUGH_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"~~(.+?)~~").unwrap());
static EMPHASIS_ASTERISK_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\*([^*\r\n]+)\*").unwrap());
static EMPHASIS_UNDERSCORE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"_([^_\r\n]+)_").unwrap());
static MARKDOWN_ESCAPE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\\([\\`*_{}\[\]()#+\-.!>])").unwrap());
static EMOJI_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F1E0}-\x{1F1FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{1F900}-\x{1F9FF}\x{1FA70}-\x{1FAFF}\x{FE00}-\x{FE0F}\x{200D}]").unwrap()
});
static LINE_WHITESPACE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?m)[\t ]+$").unwrap());
static REPEATED_HORIZONTAL_WHITESPACE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"[\t ]{2,}").unwrap());
static EXCESS_BLANK_LINES_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?:\r?\n){3,}").unwrap());

pub fn prepare_text(markdown: &str) -> String {
    if markdown.trim().is_empty() {
        return String::new();
    }

    let mut result = FENCED_CODE_REGEX.replace_all(markdown, "").to_string();
    result = HTML_COMMENT_REGEX.replace_all(&result, "").to_string();

    // Images before links
    result = IMAGE_REGEX.replace_all(&result, "").to_string();
    result = LINK_REGEX.replace_all(&result, "$1").to_string();
    result = INLINE_CODE_REGEX.replace_all(&result, "$1").to_string();
    result = HTML_TAG_REGEX.replace_all(&result, "").to_string();
    result = HEADER_REGEX.replace_all(&result, "").to_string();
    result = HASHTAG_REGEX.replace_all(&result, " $1").to_string();
    result = BLOCKQUOTE_REGEX.replace_all(&result, "").to_string();
    result = LIST_MARKER_REGEX.replace_all(&result, "").to_string();
    result = HORIZONTAL_RULE_REGEX.replace_all(&result, "").to_string();
    result = STRONG_REGEX.replace_all(&result, "$2").to_string();
    result = STRIKETHROUGH_REGEX.replace_all(&result, "$1").to_string();
    result = EMPHASIS_ASTERISK_REGEX.replace_all(&result, "$1").to_string();
    result = EMPHASIS_UNDERSCORE_REGEX.replace_all(&result, "$1").to_string();
    result = MARKDOWN_ESCAPE_REGEX.replace_all(&result, "$1").to_string();

    // Basic HTML unescape
    result = result
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'");

    result = EMOJI_REGEX.replace_all(&result, "").to_string();
    result = LINE_WHITESPACE_REGEX.replace_all(&result, " ").to_string();
    result = REPEATED_HORIZONTAL_WHITESPACE_REGEX.replace_all(&result, " ").to_string();
    result = EXCESS_BLANK_LINES_REGEX.replace_all(&result, "\n\n").to_string();

    result.trim().to_string()
}

pub fn build_ssml(text: &str, culture: &str, pitch: i32) -> String {
    let safe_text = escape_xml(text);
    let safe_culture = if culture.trim().is_empty() {
        "es-PE"
    } else {
        culture.trim()
    };
    let safe_pitch = pitch.clamp(-10, 10);
    let pitch_val = if safe_pitch > 0 {
        format!("+{}st", safe_pitch)
    } else {
        format!("{}st", safe_pitch)
    };

    format!(
        r#"<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{}"><prosody pitch="{}">{}</prosody></speak>"#,
        safe_culture, pitch_val, safe_text
    )
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_markdown_stripping() {
        let md = "# Titulo Principal\n\nEste es un **texto en negrita** y *cursiva* con un [enlace](https://example.com).\n\n```rust\nlet x = 10;\n```\n\n- Elemento 1\n- Elemento 2";
        let cleaned = prepare_text(md);
        assert!(cleaned.contains("Titulo Principal"));
        assert!(cleaned.contains("texto en negrita"));
        assert!(cleaned.contains("cursiva"));
        assert!(cleaned.contains("enlace"));
        assert!(!cleaned.contains("let x = 10;"));
        assert!(!cleaned.contains("```"));
    }
}
