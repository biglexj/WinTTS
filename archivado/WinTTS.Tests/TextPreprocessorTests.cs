using WinTTS.Services;
using Xunit;

namespace WinTTS.Tests;

public sealed class TextPreprocessorTests
{
    [Fact]
    public void Prepare_RemovesImageBeforeProcessingLinks()
    {
        string result = TextPreprocessor.Prepare("Antes ![portada](imagen.png) después");

        Assert.Equal("Antes después", result);
    }

    [Fact]
    public void Prepare_KeepsLinkTextAndRemovesDestination()
    {
        string result = TextPreprocessor.Prepare("Visita [WinTTS](https://example.com).");

        Assert.Equal("Visita WinTTS.", result);
    }

    [Fact]
    public void Prepare_DoesNotAlterSnakeCaseIdentifiers()
    {
        string result = TextPreprocessor.Prepare("speech_service usa voice_name");

        Assert.Equal("speech_service usa voice_name", result);
    }

    [Fact]
    public void Prepare_RemovesFencedCodeContent()
    {
        string result = TextPreprocessor.Prepare("Inicio\n```csharp\nConsole.WriteLine();\n```\nFin");

        Assert.Equal("Inicio\n\nFin", result);
    }

    [Fact]
    public void Prepare_CleansCommonBlockMarkers()
    {
        string result = TextPreprocessor.Prepare("# Título\n> Cita\n- Elemento\n1. Primero");

        Assert.Equal("Título\nCita\nElemento\nPrimero", result);
    }

    [Fact]
    public void Prepare_CleansEmphasisAndInlineCode()
    {
        string result = TextPreprocessor.Prepare("**fuerte**, *énfasis*, ~~tachado~~ y `código`");

        Assert.Equal("fuerte, énfasis, tachado y código", result);
    }

    [Fact]
    public void Prepare_DecodesHtmlEntitiesAndRemovesTags()
    {
        string result = TextPreprocessor.Prepare("<strong>Uno</strong> &amp; dos");

        Assert.Equal("Uno & dos", result);
    }

    [Fact]
    public void Prepare_ReturnsEmptyForWhitespace()
    {
        Assert.Equal(string.Empty, TextPreprocessor.Prepare("   \r\n"));
    }

    [Theory]
    [InlineData("Consultar la 🔮 ahora", "Consultar la ahora")]
    [InlineData("Hola 👨‍👩‍👧‍👦 familia", "Hola familia")]
    [InlineData("Perú 🇵🇪 y Japón 🇯🇵", "Perú y Japón")]
    [InlineData("Pulsa 1️⃣ para continuar", "Pulsa para continuar")]
    public void Prepare_RemovesEmojiSequences(string input, string expected)
    {
        Assert.Equal(expected, TextPreprocessor.Prepare(input));
    }

    [Fact]
    public void BuildSsml_EscapesXmlAndClampsPitch()
    {
        string result = TextPreprocessor.BuildSsml("A < B & C", "es-PE", 42);

        Assert.Contains("pitch=\"+10st\"", result);
        Assert.Contains("A &lt; B &amp; C", result);
        Assert.Contains("xml:lang=\"es-PE\"", result);
    }
}
