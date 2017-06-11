const _ = require('lodash');
const markdownIt = require('markdown-it');
const babylon = require('babylon');
const HTMLtoJSX = require('htmltojsx');
const stripIndent = require('strip-indent');
const Prism = require('prismjs');

const PACKAGE_NAME = 'babel-plugin-transform-markdown-in-jsx/component';
const elementProps = new Set(['inline']);

const highlight = (code, lang) => {
  const fallback = `<pre><code>${code}</pre></code>`;
  if (!lang) return fallback;
  // lang must be http://prismjs.com/#languages-list
  const grammar = Prism.languages[lang];
  if (!grammar) return fallback;
  const highlightedCode = Prism.highlight(code, grammar);
  // Needs the wrapper class
  return `<pre><code class="language-${lang}">${highlightedCode}</code></pre>`;
};

module.exports = babel => {
  const babelTypes = babel.types;
  const md = markdownIt({
    // Allow for HTML comment placeholders.
    // Text on new lines other than HTML comments would produce <p> tags.
    html: true,
    breaks: true,
    highlight
  });

  const markdownToJsx = (markdown, options) => {
    const text = stripIndent(markdown).trim();
    const html = options.inline ? md.renderInline(text) : md.render(text);
    const converter = new HTMLtoJSX({ createClass: false });
    let jsx = converter.convert(html);
    if (options.inline) {
      jsx = jsx
        .replace(/^\s*<div>\s*/, '<span>')
        .replace(/\s*<\/div>\s*$/, '</span>');
    }
    return jsx;
  };

  function processJSXElement(path, options) {
    const inline = path
      .get('openingElement')
      .node.attributes.some(attribute => {
        return (
          attribute.name.name === 'inline' &&
          (attribute.value === null || !!attribute.value)
        );
      });

    const fullCode = path.findParent(babelTypes.isProgram).hub.file.code;
    const mdStartIndex = path.get('openingElement').node.end;
    const mdEndIndex = path.get('closingElement').node.start;
    const contentText = fullCode.slice(mdStartIndex, mdEndIndex);

    const replacements = [];
    path.node.children.forEach((child, i) => {
      // JSXText is markdown; all else must be removed and reinserted.
      if (babelTypes.isJSXText(child)) return;
      const childText = fullCode.slice(child.start, child.end);
      // This should be unique since two nodes can't start at the same place.
      const nodeId = child.start;
      const placeholder = `bpjm${nodeId}`;
      replacements.push({
        id: nodeId,
        text: childText,
        node: child,
        placeholder
      });
    });

    // Replace from bottom to top to keep indexes in tact.
    let mdWithoutJsx = contentText;
    _.sortBy(replacements, ['contextIndex']).reverse().forEach(replacement => {
      const before = mdWithoutJsx.slice(
        0,
        replacement.node.start - mdStartIndex
      );
      const after = mdWithoutJsx.slice(replacement.node.end - mdStartIndex);
      mdWithoutJsx = [
        before,
        `<!-- ${replacement.placeholder} -->`,
        after
      ].join('');
    });

    let jsx = markdownToJsx(mdWithoutJsx, { inline });
    replacements.forEach(replacement => {
      // The HTML placeholder will have been replaced by a JSX comment.
      const jsxPlaceholder = `{/* ${replacement.placeholder} */}`;
      jsx = jsx.replace(jsxPlaceholder, replacement.text);
    });

    const parsedJsx = babylon.parseExpression(jsx, { plugins: ['jsx'] });

    // Pass attributes from the element to its replacement div or span.
    const originalAttributes = path.get('openingElement').node.attributes;
    const cleanedAttributes = originalAttributes.filter(
      node => !elementProps.has(node.name.name)
    );
    parsedJsx.openingElement.attributes = cleanedAttributes;
    path.replaceWith(parsedJsx);
  }

  const visitor = {};

  visitor.CallExpression = (path, state) => {
    if (!babelTypes.isIdentifier(path.node.callee)) return;
    if (path.node.callee.name !== 'require') return;

    const arg = path.node.arguments[0];
    if (!babelTypes.isStringLiteral(arg) || arg.value !== PACKAGE_NAME) return;

    const parentNode = path.parent;
    if (!babelTypes.isVariableDeclarator(parentNode)) {
      throw path.buildCodeFrameError(
        'You must assign babel-plugin-jsx-markdown/component to a new variable'
      );
    }
    state.tagName = parentNode.id.name;
    path.remove();
  };

  visitor.JSXIdentifier = (jsxIdentifierPath, state) => {
    // Find JSX opening and closing elements that match the name assigned at import.
    const parentNode = jsxIdentifierPath.parent;
    if (!state.tagName) return;
    if (jsxIdentifierPath.node.name !== state.tagName) return;

    if (!babelTypes.isJSXOpeningElement(parentNode)) return;
    const jsxElementPath = jsxIdentifierPath.findParent(
      babelTypes.isJSXElement
    );
    processJSXElement(jsxElementPath);
  };

  return { visitor };
};
