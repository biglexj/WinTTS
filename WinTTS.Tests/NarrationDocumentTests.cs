using System.Runtime.ExceptionServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using WinTTS.Controls;
using WinTTS.Services;
using Xunit;

namespace WinTTS.Tests;

public sealed class NarrationDocumentTests
{
    [Fact]
    public void GetReadableSelection_ReturnsOnlySelectedCharacters()
    {
        string result = RunInSta(() =>
        {
            var run = new Run("Uno dos tres");
            var editor = CreateEditor(run);
            editor.Selection.Select(
                run.ContentStart.GetPositionAtOffset(4)!,
                run.ContentStart.GetPositionAtOffset(7)!);

            return TextPreprocessor.Prepare(NarrationDocument.GetReadableSelection(editor));
        });

        Assert.Equal("dos", result);
    }

    [Fact]
    public void GetReadableSelection_ExcludesSkippedRuns()
    {
        string result = RunInSta(() =>
        {
            var included = new Run("Se lee ");
            var skipped = new Run("esto no") { Tag = NarrationDocument.SkipTag };
            var ending = new Run(" y esto sí");
            var editor = CreateEditor(included, skipped, ending);
            editor.SelectAll();

            return TextPreprocessor.Prepare(NarrationDocument.GetReadableSelection(editor));
        });

        Assert.Equal("Se lee y esto sí", result);
    }

    [Fact]
    public void MarkSelectionSkipped_PersistsVisualMarkAndExcludesText()
    {
        var result = RunInSta(() =>
        {
            var run = new Run("Uno dos tres");
            var editor = CreateEditor(run);
            editor.Selection.Select(
                run.ContentStart.GetPositionAtOffset(4)!,
                run.ContentStart.GetPositionAtOffset(7)!);

            bool marked = NarrationDocument.MarkSelectionSkipped(
                editor,
                Brushes.Orange,
                Brushes.DarkOrange);
            Run? taggedRun = editor.Document.Blocks
                .OfType<Paragraph>()
                .SelectMany(paragraph => paragraph.Inlines.Cast<Inline>())
                .OfType<Run>()
                .FirstOrDefault(candidate => Equals(candidate.Tag, NarrationDocument.SkipTag));
            string readable = TextPreprocessor.Prepare(
                NarrationDocument.GetReadableText(editor.Document));

            return (
                marked,
                hasTaggedRun: taggedRun is not null,
                hasExpectedBackground: Equals(taggedRun?.Background, Brushes.DarkOrange),
                readable,
                selectionCollapsed: editor.Selection.IsEmpty);
        });

        Assert.True(result.marked);
        Assert.True(result.hasTaggedRun);
        Assert.True(result.hasExpectedBackground);
        Assert.Equal("Uno tres", result.readable);
        Assert.True(result.selectionCollapsed);
    }

    [Fact]
    public void MarkdownPreview_RendersSyntaxAndKeepsNarrationClean()
    {
        var result = RunInSta(() =>
        {
            const string markdown = """
                # Título 👻

                Texto con **negrita** y [enlace](https://example.com).

                > Una cita

                - Elemento

                ![portada](imagen.png)

                ```csharp
                Console.WriteLine("no narrar");
                ```
                """;
            var theme = new MarkdownDocumentTheme(
                Brushes.White,
                Brushes.Gray,
                Brushes.Turquoise,
                Brushes.Black,
                Brushes.DimGray);
            FlowDocument document = MarkdownDocumentRenderer.Render(markdown, theme);
            string visible = new TextRange(document.ContentStart, document.ContentEnd).Text;
            string narrated = TextPreprocessor.Prepare(NarrationDocument.GetReadableText(document));
            var heading = Assert.IsType<Paragraph>(document.Blocks.FirstBlock);

            return (
                visible,
                narrated,
                headingIsBold: heading.FontWeight == FontWeights.Bold,
                headingSize: heading.FontSize);
        });

        Assert.DoesNotContain("# Título", result.visible);
        Assert.DoesNotContain("**negrita**", result.visible);
        Assert.DoesNotContain("https://example.com", result.visible);
        Assert.Contains("• Elemento", result.visible);
        Assert.Contains("Título", result.narrated);
        Assert.Contains("Texto con negrita y enlace.", result.narrated);
        Assert.Contains("Una cita", result.narrated);
        Assert.Contains("Elemento", result.narrated);
        Assert.DoesNotContain("portada", result.narrated);
        Assert.DoesNotContain("Console", result.narrated);
        Assert.True(result.headingIsBold);
        Assert.True(result.headingSize > 20);
    }

    [Fact]
    public void MarkdownSource_HighlightsAndExcludesOnlyNonNarratedTokens()
    {
        var result = RunInSta(() =>
        {
            const string source = "## 🔮 Título con **negrita**, #etiqueta y [enlace](https://example.com)\n- Elemento";
            FlowDocument document = MarkdownSourceHighlighter.Render(
                source,
                Brushes.White,
                Brushes.Orange,
                Brushes.DarkOrange);
            var runs = document.Blocks
                .OfType<Paragraph>()
                .SelectMany(paragraph => paragraph.Inlines.Cast<Inline>())
                .OfType<Run>()
                .ToList();
            string omitted = string.Concat(runs
                .Where(run => Equals(run.Tag, NarrationDocument.NonNarratedTag))
                .Select(run => run.Text));
            bool allOmittedRunsAreAmber = runs
                .Where(run => Equals(run.Tag, NarrationDocument.NonNarratedTag))
                .All(run => Equals(run.Foreground, Brushes.Orange) &&
                            Equals(run.Background, Brushes.DarkOrange));
            string narrated = TextPreprocessor.Prepare(NarrationDocument.GetReadableText(document));

            return (omitted, narrated, allOmittedRunsAreAmber);
        });

        Assert.Contains("## ", result.omitted);
        Assert.Contains("🔮", result.omitted);
        Assert.Contains("#", result.omitted);
        Assert.Contains("**", result.omitted);
        Assert.Contains("https://example.com", result.omitted);
        Assert.Contains("- ", result.omitted);
        Assert.Equal("Título con negrita, etiqueta y enlace\nElemento", result.narrated);
        Assert.True(result.allOmittedRunsAreAmber);
    }

    private static RichTextBox CreateEditor(params Inline[] inlines)
    {
        var paragraph = new Paragraph();
        paragraph.Inlines.AddRange(inlines);
        return new RichTextBox { Document = new FlowDocument(paragraph) };
    }

    private static T RunInSta<T>(Func<T> action)
    {
        T? result = default;
        Exception? exception = null;
        var thread = new Thread(() =>
        {
            try
            {
                result = action();
            }
            catch (Exception caught)
            {
                exception = caught;
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();

        if (exception is not null)
        {
            ExceptionDispatchInfo.Capture(exception).Throw();
        }

        return result!;
    }
}
