use super::*;

#[test]
fn test_parse_empty_markdown() {
    let doc = parse_markdown("", None).expect("failed to parse empty markdown");
    assert!(doc.blocks.is_empty());
    assert_eq!(doc.metadata.word_count, 0);
    assert_eq!(doc.metadata.headings_count, 0);
    assert_eq!(doc.metadata.title, None);
}

#[test]
fn test_parse_paragraphs_and_text() {
    let input = "First paragraph.\n\nSecond paragraph with multiple sentences.";
    let doc = parse_markdown(input, None).expect("failed to parse paragraphs");
    assert_eq!(doc.blocks.len(), 2);

    match &doc.blocks[0] {
        BlockNode::Paragraph { content } => {
            assert_eq!(content.len(), 1);
            assert_eq!(
                content[0],
                InlineNode::Text {
                    value: "First paragraph.".to_string()
                }
            );
        }
        _ => panic!("expected paragraph"),
    }

    assert!(doc.metadata.word_count > 0);
}

#[test]
fn test_parse_headings_h1_to_h6() {
    let input = "# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6";
    let doc = parse_markdown(input, None).expect("failed to parse headings");
    assert_eq!(doc.blocks.len(), 6);
    assert_eq!(doc.metadata.headings_count, 6);
    assert_eq!(doc.metadata.title, Some("Heading 1".to_string()));

    for (idx, block) in doc.blocks.iter().enumerate() {
        match block {
            BlockNode::Heading { level, content, .. } => {
                assert_eq!(*level, (idx + 1) as u8);
                assert!(!content.is_empty());
            }
            _ => panic!("expected heading"),
        }
    }
}

#[test]
fn test_parse_nested_inlines_bold_italic_strikethrough() {
    let input = "This is **bold and *italic* text** and ~~strikethrough~~ with `inline code`.";
    let doc = parse_markdown(input, None).expect("failed to parse inlines");
    assert_eq!(doc.blocks.len(), 1);

    if let BlockNode::Paragraph { content } = &doc.blocks[0] {
        // Must contain strong with nested emphasis
        let mut found_strong_with_nested_emphasis = false;
        let mut found_strikethrough = false;
        let mut found_code = false;

        for node in content {
            match node {
                InlineNode::Strong {
                    content: strong_children,
                } => {
                    for child in strong_children {
                        if let InlineNode::Emphasis { .. } = child {
                            found_strong_with_nested_emphasis = true;
                        }
                    }
                }
                InlineNode::Strikethrough { .. } => found_strikethrough = true,
                InlineNode::Code { code } if code == "inline code" => found_code = true,
                _ => {}
            }
        }

        assert!(
            found_strong_with_nested_emphasis,
            "nested bold/italic not preserved"
        );
        assert!(found_strikethrough, "strikethrough not found");
        assert!(found_code, "inline code not found");
    } else {
        panic!("expected paragraph");
    }
}

#[test]
fn test_parse_links_and_images() {
    let input = "[Devson Link](https://devson.com \"Devson Title\") and ![App Logo](/logo.png \"Logo Hover\")";
    let doc = parse_markdown(input, None).expect("failed to parse link and image");
    assert_eq!(doc.blocks.len(), 1);

    if let BlockNode::Paragraph { content } = &doc.blocks[0] {
        let mut found_link = false;
        let mut found_image = false;

        for node in content {
            match node {
                InlineNode::Link {
                    url,
                    title,
                    content,
                } => {
                    assert_eq!(url, "https://devson.com");
                    assert_eq!(title.as_deref(), Some("Devson Title"));
                    assert_eq!(
                        content[0],
                        InlineNode::Text {
                            value: "Devson Link".to_string()
                        }
                    );
                    found_link = true;
                }
                InlineNode::Image { url, title, alt } => {
                    assert_eq!(url, "/logo.png");
                    assert_eq!(title.as_deref(), Some("Logo Hover"));
                    assert_eq!(alt, "App Logo");
                    found_image = true;
                }
                _ => {}
            }
        }

        assert!(found_link, "link not found");
        assert!(found_image, "image not found");
    } else {
        panic!("expected paragraph");
    }
}

#[test]
fn test_parse_code_blocks_fenced_and_indented() {
    let input =
        "```rust\nfn main() {\n    println!(\"Hello!\");\n}\n```\n\n    indented code block";
    let doc = parse_markdown(input, None).expect("failed to parse code blocks");
    assert_eq!(doc.blocks.len(), 2);
    assert!(doc.metadata.has_code_blocks);

    match &doc.blocks[0] {
        BlockNode::CodeBlock {
            language,
            code,
            is_fenced,
        } => {
            assert_eq!(language.as_deref(), Some("rust"));
            assert!(*is_fenced);
            assert!(code.contains("fn main()"));
        }
        _ => panic!("expected fenced code block"),
    }

    match &doc.blocks[1] {
        BlockNode::CodeBlock {
            language,
            code,
            is_fenced,
        } => {
            assert_eq!(*language, None);
            assert!(!*is_fenced);
            assert!(code.contains("indented code block"));
        }
        _ => panic!("expected indented code block"),
    }
}

#[test]
fn test_parse_mermaid_code_block() {
    let input = "```mermaid\ngraph TD;\n    A-->B;\n```";
    let doc = parse_markdown(input, None).expect("failed to parse mermaid");
    assert!(doc.metadata.has_mermaid);
    assert!(doc.metadata.has_code_blocks);
}

#[test]
fn test_parse_unordered_and_ordered_nested_lists() {
    let input = "- Item 1\n- Item 2\n  1. Sub item 1\n  2. Sub item 2\n- Item 3";
    let doc = parse_markdown(input, None).expect("failed to parse lists");
    assert_eq!(doc.blocks.len(), 1);

    match &doc.blocks[0] {
        BlockNode::List {
            is_ordered, items, ..
        } => {
            assert!(!*is_ordered);
            assert_eq!(items.len(), 3);

            // Item 2 has a nested list
            let item2 = &items[1];
            let mut found_nested_ordered_list = false;
            for child in &item2.content {
                if let BlockNode::List {
                    is_ordered: true,
                    start_number,
                    items: sub_items,
                    ..
                } = child
                {
                    assert_eq!(*start_number, Some(1));
                    assert_eq!(sub_items.len(), 2);
                    found_nested_ordered_list = true;
                }
            }
            assert!(found_nested_ordered_list, "nested ordered list missing");
        }
        _ => panic!("expected list block"),
    }
}

#[test]
fn test_parse_task_lists() {
    let input = "- [ ] Incomplete task\n- [x] Completed task";
    let doc = parse_markdown(input, None).expect("failed to parse task lists");
    assert!(doc.metadata.has_task_lists);

    match &doc.blocks[0] {
        BlockNode::List { items, .. } => {
            assert_eq!(items.len(), 2);
            assert_eq!(items[0].checked, Some(false));
            assert_eq!(items[1].checked, Some(true));
        }
        _ => panic!("expected list block"),
    }
}

#[test]
fn test_parse_blockquotes_nested_and_admonitions() {
    let input = "> [!WARNING]\n> This is a critical alert.\n>\n> > Nested quote inside alert.";
    let doc = parse_markdown(input, None).expect("failed to parse blockquotes");
    assert_eq!(doc.blocks.len(), 1);

    match &doc.blocks[0] {
        BlockNode::Blockquote { kind, content } => {
            assert_eq!(kind.as_deref(), Some("warning"));
            assert!(!content.is_empty());

            let mut found_nested_blockquote = false;
            for child in content {
                if let BlockNode::Blockquote { .. } = child {
                    found_nested_blockquote = true;
                }
            }
            assert!(found_nested_blockquote, "nested blockquote not found");
        }
        _ => panic!("expected blockquote"),
    }
}

#[test]
fn test_parse_tables() {
    let input = "| Name | Description | Status |\n| :--- | :---: | ---: |\n| Alpha | First item | Ready |\n| Beta | Second item | Done |";
    let doc = parse_markdown(input, None).expect("failed to parse table");
    assert_eq!(doc.blocks.len(), 1);
    assert!(doc.metadata.has_tables);

    match &doc.blocks[0] {
        BlockNode::Table { columns, rows } => {
            assert_eq!(columns.len(), 3);
            assert_eq!(columns[0].align, TableAlignment::Left);
            assert_eq!(columns[1].align, TableAlignment::Center);
            assert_eq!(columns[2].align, TableAlignment::Right);

            assert_eq!(rows.len(), 2);
            assert_eq!(rows[0].cells.len(), 3);
            assert_eq!(rows[1].cells.len(), 3);
        }
        _ => panic!("expected table block"),
    }
}

#[test]
fn test_parse_thematic_break_and_html_inert() {
    let input = "Paragraph before rule.\n\n---\n\n<div class=\"safe-inert-html\"><p>Inert HTML</p></div>\n\nParagraph after rule.";
    let doc = parse_markdown(input, None).expect("failed to parse thematic break and html");
    assert_eq!(doc.blocks.len(), 4);

    assert!(matches!(doc.blocks[0], BlockNode::Paragraph { .. }));
    assert!(matches!(doc.blocks[1], BlockNode::ThematicBreak));
    match &doc.blocks[2] {
        BlockNode::HtmlBlock { content } => {
            assert!(content.contains("<div class=\"safe-inert-html\">"));
        }
        _ => panic!("expected html block"),
    }
    assert!(matches!(doc.blocks[3], BlockNode::Paragraph { .. }));
}

#[test]
fn test_parse_footnotes() {
    let input =
        "Here is a statement with a footnote[^1].\n\n[^1]: This is the footnote definition.";
    let doc = parse_markdown(input, None).expect("failed to parse footnotes");
    assert_eq!(doc.blocks.len(), 2);

    match &doc.blocks[0] {
        BlockNode::Paragraph { content } => {
            let mut found_ref = false;
            for node in content {
                if let InlineNode::FootnoteReference { label } = node {
                    assert_eq!(label, "1");
                    found_ref = true;
                }
            }
            assert!(found_ref, "footnote reference not found");
        }
        _ => panic!("expected paragraph"),
    }

    match &doc.blocks[1] {
        BlockNode::FootnoteDefinition { label, content } => {
            assert_eq!(label, "1");
            assert!(!content.is_empty());
        }
        _ => panic!("expected footnote definition"),
    }
}

#[test]
fn test_parse_yaml_frontmatter() {
    let input = "---\ntitle: \"Custom Document Title\"\nauthor: \"Devson\"\n---\n\n# Body Heading\n\nBody content.";
    let doc = parse_markdown(input, None).expect("failed to parse frontmatter");

    assert!(doc.metadata.frontmatter.is_some());
    let fm = doc.metadata.frontmatter.as_ref().unwrap();
    assert!(fm.contains("title: \"Custom Document Title\""));
    assert_eq!(
        doc.metadata.title,
        Some("Custom Document Title".to_string())
    );

    // Frontmatter should NOT be in doc.blocks
    assert_eq!(doc.blocks.len(), 2);
    assert!(matches!(doc.blocks[0], BlockNode::Heading { .. }));
    assert!(matches!(doc.blocks[1], BlockNode::Paragraph { .. }));
}

#[test]
fn test_parse_unicode_emoji_and_multilingual() {
    let input = "# 🚀 Rocket Title: 日本語・한국어・العربية・हिन्दी\n\nEmoji test: ✨ 🎉 💻 🦀 with **bold 🌍 planet**.";
    let doc = parse_markdown(input, None).expect("failed to parse unicode and emoji");
    assert_eq!(doc.blocks.len(), 2);
    assert!(doc.metadata.title.unwrap().contains("🚀"));
    assert!(doc.metadata.word_count > 0);
    assert!(doc.metadata.character_count > 0);
}

#[test]
fn test_parse_malformed_unclosed_syntax_does_not_panic() {
    let input = "# Unclosed [link without target\n\n**unclosed bold text *unclosed italic\n\n| missing | table | pipes\n| --- |";
    let doc = parse_markdown(input, None).expect("malformed markdown should degrade gracefully");
    assert!(!doc.blocks.is_empty());
}

#[test]
fn test_serde_json_serialization_roundtrip() {
    let input = "# Test\n\nParagraph with `code`.\n\n```rust\nfn main() {}\n```";
    let doc = parse_markdown(input, None).expect("failed to parse");

    let json_str = serde_json::to_string_pretty(&doc).expect("serialization to JSON failed");
    assert!(json_str.contains("\"type\": \"heading\""));
    assert!(json_str.contains("\"type\": \"paragraph\""));
    assert!(json_str.contains("\"type\": \"codeBlock\""));
    assert!(json_str.contains("\"parserVersion\": \"pulldown-cmark-0.13\""));

    let deserialized: MarkdownDocument =
        serde_json::from_str(&json_str).expect("deserialization from JSON failed");
    assert_eq!(doc, deserialized);
}

#[test]
fn test_parse_inline_and_block_math() {
    let input = "Einstein said $E = mc^2$ in relativity.\n\n$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$\n\nAnother equation.";
    let doc = parse_markdown(input, None).expect("failed to parse math markdown");

    assert!(
        doc.metadata.has_math,
        "Document metadata should indicate hasMath is true"
    );

    // Block 0: Paragraph with inline math
    match &doc.blocks[0] {
        BlockNode::Paragraph { content } => {
            let found_inline_math = content.iter().any(|node| match node {
                InlineNode::InlineMath { math } => math == "E = mc^2",
                _ => false,
            });
            assert!(
                found_inline_math,
                "Should contain InlineMath node with 'E = mc^2'"
            );
        }
        _ => panic!("Expected paragraph for block 0"),
    }

    // Block 1: BlockMath
    match &doc.blocks[1] {
        BlockNode::BlockMath { math } => {
            assert!(math.contains("\\int_0^1"));
        }
        _ => panic!("Expected BlockMath for block 1"),
    }
}

#[test]
fn test_parse_mermaid_code_block_metadata() {
    let input = "```mermaid\ngraph TD;\n    A-->B;\n```";
    let doc = parse_markdown(input, None).expect("failed to parse mermaid");

    assert!(doc.metadata.has_mermaid, "hasMermaid should be true");
    assert!(doc.metadata.has_code_blocks, "hasCodeBlocks should be true");

    match &doc.blocks[0] {
        BlockNode::CodeBlock { language, code, .. } => {
            assert_eq!(language.as_deref(), Some("mermaid"));
            assert!(code.contains("A-->B"));
        }
        _ => panic!("Expected CodeBlock with mermaid language"),
    }
}
