const babel = require('babel-core');
const babelEs2015 = require('babel-preset-es2015');
const babelReact = require('babel-preset-react');
const plugin = require('../');

const transform = code => {
  const module = `
    const React = require('react');
    const Markdown = require('babel-plugin-transform-markdown-in-jsx/component');
    function TestComponent() {
      ${code};
    }`;
  return babel.transform(module, {
    presets: [babelEs2015, babelReact],
    plugins: [plugin]
  }).code;
};

test('basic usage', () => {
  const renderBody = `return (
    <Markdown>
      # Title

      This is **bold.**

      Here is a [link](/some/url).
    </Markdown>
  )`;

  expect(transform(renderBody)).toMatchSnapshot();
});

test('basic usage inline', () => {
  const renderBody = `return (
    <div>
      Here is <Markdown inline>_interpolated_ markdown</Markdown>
    </div>
  )`;

  expect(transform(renderBody)).toMatchSnapshot();
});

test('nested jsx', () => {
  const renderBody = `var number = 4;
    return (
      <Markdown>
        Here is a number: <span style={{ fontWeight: 'bold' }}>{number}</span>. Here it is again: {number}.
      </Markdown>
    )`;

  expect(transform(renderBody)).toMatchSnapshot();
});

test('extra props to element', () => {
  const renderBody = `return (
    <p>
      Here is <Markdown inline style={{ background: '#eee' }}>_interpolated_ markdown</Markdown>
    </p>
  )`;

  expect(transform(renderBody)).toMatchSnapshot();
});

test('syntax highlighting', () => {
  const renderBody = `return (
    <Markdown>
      Here is a [link](#thing).

      \`\`\`js
      var thing = 'two' === 48;
      var three = 4;
      \`\`\`
    </Markdown>
  )`;

  expect(transform(renderBody)).toMatchSnapshot();
});
