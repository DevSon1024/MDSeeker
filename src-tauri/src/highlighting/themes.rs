use syntect::highlighting::{Color, FontStyle, Theme, ThemeSet};

/// Returns the appropriate syntect Theme based on user-requested theme mode ("light" or "dark").
pub fn select_theme<'a>(theme_set: &'a ThemeSet, theme_mode: Option<&str>) -> &'a Theme {
    match theme_mode {
        Some("light") => theme_set
            .themes
            .get("InspiredGitHub")
            .or_else(|| theme_set.themes.get("Solarized (light)"))
            .unwrap_or_else(|| {
                theme_set
                    .themes
                    .values()
                    .next()
                    .expect("themes must not be empty")
            }),
        _ => theme_set
            .themes
            .get("base16-ocean.dark")
            .or_else(|| theme_set.themes.get("base16-eighties.dark"))
            .or_else(|| theme_set.themes.get("Solarized (dark)"))
            .unwrap_or_else(|| {
                theme_set
                    .themes
                    .values()
                    .next()
                    .expect("themes must not be empty")
            }),
    }
}

/// Formats a syntect Color into a standard 6-digit hex color string "#rrggbb".
pub fn format_hex_color(color: Color) -> String {
    format!("#{:02x}{:02x}{:02x}", color.r, color.g, color.b)
}

/// Converts syntect FontStyle flags into a serializable font style string.
pub fn format_font_style(font_style: FontStyle) -> Option<String> {
    let is_bold = font_style.contains(FontStyle::BOLD);
    let is_italic = font_style.contains(FontStyle::ITALIC);

    if is_bold && is_italic {
        Some("boldItalic".to_string())
    } else if is_bold {
        Some("bold".to_string())
    } else if is_italic {
        Some("italic".to_string())
    } else {
        None
    }
}
