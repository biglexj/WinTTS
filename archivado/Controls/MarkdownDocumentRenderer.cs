using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;

namespace WinTTS.Controls;

public sealed record MarkdownDocumentTheme(
    Brush Text,
    Brush MutedText,
    Brush Accent,
    Brush CodeBackground,
    Brush Border);

public static partial class MarkdownDocumentRenderer
{
    public static FlowDocument Render(string? markdown, MarkdownDocumentTheme theme)
    {
        var document = new FlowDocument
        {
            PagePadding = new Thickness(0),
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 16,
            Foreground = theme.Text
        };

        string[] lines = (markdown ?? string.Empty)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n')
            .Split('\n');

        for (int index = 0; index < lines.Length;)
        {
            string line = lines[index];
            if (string.IsNullOrWhiteSpace(line))
            {
                index++;
                continue;
            }

            Match fence = FenceRegex().Match(line);
            if (fence.Success)
            {
                index++;
                var code = new StringBuilder();
                while (index < lines.Length && !FenceEndRegex().IsMatch(lines[index]))
                {
                    if (code.Length > 0)
                    {
                        code.AppendLine();
                    }

                    code.Append(lines[index]);
                    index++;
                }

                if (index < lines.Length)
                {
                    index++;
                }

                document.Blocks.Add(CreateCodeBlock(code.ToString(), theme));
                continue;
            }

            Match heading = HeadingRegex().Match(line);
            if (heading.Success)
            {
                int level = heading.Groups[1].Value.Length;
                var paragraph = CreateParagraph();
                paragraph.FontSize = level switch
                {
                    1 => 30,
                    2 => 25,
                    3 => 21,
                    _ => 18
                };
                paragraph.FontWeight = FontWeights.Bold;
                paragraph.Foreground = level <= 2 ? theme.Accent : theme.Text;
                paragraph.Margin = new Thickness(0, level == 1 ? 2 : 8, 0, 8);
                AddInlineContent(paragraph.Inlines, heading.Groups[2].Value, theme);
                document.Blocks.Add(paragraph);
                index++;
                continue;
            }

            if (BlockQuoteRegex().IsMatch(line))
            {
                var quoteText = new StringBuilder();
                while (index < lines.Length)
                {
                    Match quote = BlockQuoteRegex().Match(lines[index]);
                    if (!quote.Success)
                    {
                        break;
                    }

                    if (quoteText.Length > 0)
                    {
                        quoteText.Append(' ');
                    }

                    quoteText.Append(quote.Groups[1].Value);
                    index++;
                }

                var paragraph = CreateParagraph();
                paragraph.BorderBrush = theme.Accent;
                paragraph.BorderThickness = new Thickness(3, 0, 0, 0);
                paragraph.Padding = new Thickness(12, 4, 0, 4);
                paragraph.Foreground = theme.MutedText;
                AddInlineContent(paragraph.Inlines, quoteText.ToString(), theme);
                document.Blocks.Add(paragraph);
                continue;
            }

            Match listItem = ListItemRegex().Match(line);
            if (listItem.Success)
            {
                while (index < lines.Length && (listItem = ListItemRegex().Match(lines[index])).Success)
                {
                    var paragraph = CreateParagraph();
                    paragraph.Margin = new Thickness(18, 2, 0, 4);
                    string marker = char.IsDigit(listItem.Groups[1].Value[0])
                        ? listItem.Groups[1].Value
                        : "•";
                    paragraph.Inlines.Add(new Run(marker + " ")
                    {
                        Foreground = theme.Accent,
                        FontWeight = FontWeights.Bold
                    });
                    AddInlineContent(paragraph.Inlines, listItem.Groups[2].Value, theme);
                    document.Blocks.Add(paragraph);
                    index++;
                }

                continue;
            }

            if (HorizontalRuleRegex().IsMatch(line))
            {
                document.Blocks.Add(new Paragraph
                {
                    BorderBrush = theme.Border,
                    BorderThickness = new Thickness(0, 0, 0, 1),
                    Margin = new Thickness(0, 8, 0, 12),
                    FontSize = 1
                });
                index++;
                continue;
            }

            var paragraphText = new StringBuilder();
            while (index < lines.Length &&
                   !string.IsNullOrWhiteSpace(lines[index]) &&
                   !IsBlockStart(lines[index]))
            {
                if (paragraphText.Length > 0)
                {
                    paragraphText.Append(' ');
                }

                paragraphText.Append(lines[index].Trim());
                index++;
            }

            // A non-empty line always reaches one of the branches above or this
            // paragraph fallback, so this also guarantees forward progress.
            if (paragraphText.Length == 0)
            {
                paragraphText.Append(line.Trim());
                index++;
            }

            var body = CreateParagraph();
            AddInlineContent(body.Inlines, paragraphText.ToString(), theme);
            document.Blocks.Add(body);
        }

        if (document.Blocks.Count == 0)
        {
            document.Blocks.Add(CreateParagraph());
        }

        return document;
    }

    private static Paragraph CreateParagraph() => new()
    {
        LineHeight = 24,
        Margin = new Thickness(0, 0, 0, 10)
    };

    private static Paragraph CreateCodeBlock(string code, MarkdownDocumentTheme theme)
    {
        var paragraph = CreateParagraph();
        paragraph.Tag = NarrationDocument.NonNarratedTag;
        paragraph.FontFamily = new FontFamily("Cascadia Mono, Consolas");
        paragraph.FontSize = 14;
        paragraph.Background = theme.CodeBackground;
        paragraph.BorderBrush = theme.Border;
        paragraph.BorderThickness = new Thickness(1);
        paragraph.Padding = new Thickness(12, 10, 12, 10);
        paragraph.Inlines.Add(new Run(code));
        return paragraph;
    }

    private static void AddInlineContent(
        InlineCollection target,
        string text,
        MarkdownDocumentTheme theme)
    {
        int position = 0;
        foreach (Match match in InlineMarkdownRegex().Matches(text))
        {
            if (match.Index > position)
            {
                target.Add(new Run(text[position..match.Index]));
            }

            if (match.Groups["image"].Success)
            {
                target.Add(new Run($"[Imagen: {match.Groups["image"].Value}]")
                {
                    Foreground = theme.MutedText,
                    FontStyle = FontStyles.Italic,
                    Tag = NarrationDocument.NonNarratedTag
                });
            }
            else if (match.Groups["link"].Success)
            {
                target.Add(new Run(match.Groups["link"].Value)
                {
                    Foreground = theme.Accent,
                    TextDecorations = TextDecorations.Underline
                });
            }
            else if (match.Groups["bold"].Success || match.Groups["boldAlt"].Success)
            {
                string value = match.Groups["bold"].Success
                    ? match.Groups["bold"].Value
                    : match.Groups["boldAlt"].Value;
                target.Add(new Run(value) { FontWeight = FontWeights.Bold });
            }
            else if (match.Groups["strike"].Success)
            {
                target.Add(new Run(match.Groups["strike"].Value)
                {
                    Foreground = theme.MutedText,
                    TextDecorations = TextDecorations.Strikethrough
                });
            }
            else if (match.Groups["code"].Success)
            {
                target.Add(new Run(match.Groups["code"].Value)
                {
                    FontFamily = new FontFamily("Cascadia Mono, Consolas"),
                    Background = theme.CodeBackground,
                    Foreground = theme.Accent
                });
            }
            else
            {
                string value = match.Groups["italic"].Success
                    ? match.Groups["italic"].Value
                    : match.Groups["italicAlt"].Value;
                target.Add(new Run(value) { FontStyle = FontStyles.Italic });
            }

            position = match.Index + match.Length;
        }

        if (position < text.Length)
        {
            target.Add(new Run(text[position..]));
        }
    }

    private static bool IsBlockStart(string line) =>
        FenceRegex().IsMatch(line) ||
        HeadingRegex().IsMatch(line) ||
        BlockQuoteRegex().IsMatch(line) ||
        ListItemRegex().IsMatch(line) ||
        HorizontalRuleRegex().IsMatch(line);

    [GeneratedRegex(@"^\s*(```|~~~)")]
    private static partial Regex FenceRegex();

    [GeneratedRegex(@"^\s*(```|~~~)\s*$")]
    private static partial Regex FenceEndRegex();

    [GeneratedRegex(@"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$")]
    private static partial Regex HeadingRegex();

    [GeneratedRegex(@"^\s{0,3}>\s?(.*)$")]
    private static partial Regex BlockQuoteRegex();

    [GeneratedRegex(@"^\s*((?:[-+*])|(?:\d+[.)]))\s+(.+)$")]
    private static partial Regex ListItemRegex();

    [GeneratedRegex(@"^\s{0,3}(?:[-*_]\s*){3,}$")]
    private static partial Regex HorizontalRuleRegex();

    [GeneratedRegex(@"!\[(?<image>[^\]]*)\]\([^)]*\)|\[(?<link>[^\]]+)\]\([^)]*\)|\*\*(?<bold>.+?)\*\*|__(?<boldAlt>.+?)__|~~(?<strike>.+?)~~|`(?<code>[^`]+)`|(?<!\*)\*(?<italic>[^*\r\n]+)\*(?!\*)|(?<![\w_])_(?<italicAlt>[^_\r\n]+)_(?![\w_])")]
    private static partial Regex InlineMarkdownRegex();
}
