use super::*;

#[test]
fn test_exact_reconstruction_property() {
    let test_cases = vec![
        ("fn main() {\n    println!(\"Hello, world!\");\n}\n", "rust"),
        ("def greet(name: str) -> str:\n    return f\"Hello {name}\"\n", "py"),
        ("const add = (a: number, b: number): number => a + b;\n", "typescript"),
        ("{\n  \"name\": \"mdseeker\",\n  \"version\": 1\n}\n", "json"),
        ("<div class=\"hero\"><p>Hello</p></div>\n", "html"),
        ("body { margin: 0; padding: 12px; }\n", "css"),
        ("select * from users where id = 1;\n", "sql"),
        ("echo \"Hello from shell script\"\nexit 0\n", "sh"),
        ("unknown language block with strange content %^&*()", "nonexistent_lang"),
        ("single line without newline", "rust"),
        ("\n\n\n", "rust"),
        ("", "rust"),
    ];

    for (code, lang) in test_cases {
        let result = highlight_code(code, Some(lang), Some("dark"));
        let reconstructed: String = result
            .lines
            .iter()
            .flat_map(|line| &line.tokens)
            .map(|t| t.content.as_str())
            .collect();

        assert_eq!(
            reconstructed, code,
            "Reconstruction failed for language '{}'. Expected {:?}, got {:?}",
            lang, code, reconstructed
        );
    }
}

#[test]
fn test_rust_highlighting_colors_and_styles() {
    let code = "pub fn calculate(x: i32) -> i32 {\n    x * 2\n}";
    let result = highlight_code(code, Some("rust"), Some("dark"));

    assert_eq!(result.language, "Rust");
    assert_eq!(result.lines.len(), 3);

    // Verify tokens contain colors
    let has_colored_token = result
        .lines
        .iter()
        .flat_map(|l| &l.tokens)
        .any(|t| t.color.is_some());
    assert!(has_colored_token, "Rust code should have syntax colors");
}

#[test]
fn test_python_and_aliases() {
    let code = "import os\n\ndef run():\n    pass";
    let res_py = highlight_code(code, Some("py"), Some("dark"));
    let res_python = highlight_code(code, Some("python"), Some("dark"));

    assert_eq!(res_py.language, "Python");
    assert_eq!(res_python.language, "Python");
    assert_eq!(res_py.lines.len(), 4);
    assert_eq!(res_python.lines.len(), 4);
}

#[test]
fn test_javascript_typescript_aliases() {
    let js_code = "const val = 42;";
    let res_js = highlight_code(js_code, Some("js"), Some("dark"));
    assert_eq!(res_js.language, "JavaScript");

    let ts_code = "const count: number = 100;";
    let res_ts = highlight_code(ts_code, Some("ts"), Some("dark"));
    // Mapped via alias to JavaScript engine
    assert_eq!(res_ts.language, "JavaScript");
    let has_color = res_ts.lines[0].tokens.iter().any(|t| t.color.is_some());
    assert!(has_color, "TypeScript code mapped to JavaScript should have syntax colors");
}

#[test]
fn test_json_and_html_highlighting() {
    let json_code = "{\"active\": true}";
    let res_json = highlight_code(json_code, Some("json"), Some("light"));
    assert_eq!(res_json.language, "JSON");

    let html_code = "<!DOCTYPE html><html><body>Content</body></html>";
    let res_html = highlight_code(html_code, Some("html"), Some("light"));
    assert_eq!(res_html.language, "HTML");
}

#[test]
fn test_unknown_language_fallback() {
    let code = "custom_syntax_foo = bar(123)";
    let result = highlight_code(code, Some("pseudocode_xyz"), Some("dark"));

    assert_eq!(result.language, "Plain Text");
    assert_eq!(result.lines.len(), 1);
    assert_eq!(result.lines[0].tokens[0].content, code);
}

#[test]
fn test_light_and_dark_themes_differ() {
    let code = "fn main() { let x = 10; }";
    let light_res = highlight_code(code, Some("rust"), Some("light"));
    let dark_res = highlight_code(code, Some("rust"), Some("dark"));

    assert_eq!(light_res.lines.len(), 1);
    assert_eq!(dark_res.lines.len(), 1);

    let light_colors: Vec<_> = light_res.lines[0]
        .tokens
        .iter()
        .map(|t| t.color.clone())
        .collect();
    let dark_colors: Vec<_> = dark_res.lines[0]
        .tokens
        .iter()
        .map(|t| t.color.clone())
        .collect();

    assert_ne!(
        light_colors, dark_colors,
        "Light and dark themes should produce different colors"
    );
}

#[test]
fn test_oversized_code_fallback() {
    // 1 MB + 10 bytes
    let large_code = "a".repeat(1_000_010);
    let result = highlight_code(&large_code, Some("rust"), Some("dark"));

    assert_eq!(result.lines.len(), 1);
    assert_eq!(result.lines[0].tokens[0].content.len(), 1_000_010);
}
