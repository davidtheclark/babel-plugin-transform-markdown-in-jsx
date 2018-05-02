# babel-plugin-transform-markdown-jsx


Transform Markdown inside JSX to DOM elements at compile time.

🚧🚧  **EXPERIMENTAL WORK IN PROGRESS (see caveats)** 🚧🚧

---

## Not for public consumption 

Instead, check out [jsxtreme-markdown](https://github.com/mapbox/jsxtreme-markdown), which turned out to be a better idea, I think.

---

## Purpose

Maybe you want to write Markdown directly inside JSX.
And maybe you don't want to add a Markdown-parsing library to your bundle, so you'd like your Markdown to be compiled when Babel runs, rather than in the browser.
Finally, you want the Markdown text to work like regular JSX text, so you can interpolate expressions and other JSX elements within it.

## Usage

1. Include this plugin in your Babel configuration.
2. Use the component you can `require` from `babel-plugin-transform-markdown-jsx/component` in your JSX, wrapping Markdown.

The component has one prop.
- **inline**: Default: `false`. If `true`, the Markdown will be rendered as a `<span>`, By default, it is wrapped in a `<div>`.

Additional props on the component are passed directly to the `<div>` or `<span>` it creates (e.g. `className`).

Markdown is parsed with [markdown-it](https://github.com/markdown-it/markdown-it).
Code blocks are highlighted with [Prism](https://github.com/PrismJS/prism) ... *but beware of code*. See the caveat below.

```jsx
const React = require('react');
const Markdown = require('babel-plugin-transform-markdown-jsx/component');

function MyComponent() {
  const count = 4;
  return (
    <div>
      This text is **not** Markdown.

      <Markdown>
        ## Heading

        *This* text, though, **is** Markdown.

        And this is the second paragraph of it, with a [link](/some/url).

        <div style={{ margin: 60 }}>
          This is not Markdown anymore: it's an interpolated JSX element.
        </div>

        You can also render expressions: {count * 2}.
      </Markdown>

      Once again, this is not Markdown.

      <p>
        Here is some <Markdown inline={true} style={{ color: 'pink' }}>*inline* **Markdown**</Markdown>.
      </p>
    </div>
  );
}
```

## Caveats

- Content within nested JSX elements and expressions is *not* parsed as Markdown.
- Code in the Markdown will work fine *as long as you don't use any braces*.
  However, lots of code uses braces.
  So code generally does not work fine.

## Prior Art

- [markdown-component-loader](https://github.com/ticky/markdown-component-loader) provided the idea of extracting JSX elements and expressions from the text before parsing Markdown, converting the Markdown HTML to JSX, and then restoring the extracted code to its place.
- [markdown-in-js](https://github.com/threepointone/markdown-in-js) also compiles Markdown when Babel runs.
  It uses a tagged template literal instead of a JSX element, and it is much, much more complicated than this module.
