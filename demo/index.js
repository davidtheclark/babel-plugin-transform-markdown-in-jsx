const React = require('react');
const ReactDOM = require('react-dom');
const Markdown = require('babel-plugin-transform-markdown-in-jsx/component');

class Example extends React.Component {
  render() {
    const number = 4;

    return (
      <div>
        <Markdown style={{ background: '#eee' }}>
          # Title

          This is **bold**.

          Here is a number: <span style={{ fontWeight: 'bold' }}>
            {number}
          </span>. Here it is again: {number}.

          <div style={{ margin: '24px 0' }}>thing</div>

          Here is a [link](#thing).

          ```js
          var thing = 'two' === 48;
          var three = 4;
          ```
        </Markdown>

        <p>
          Here is <Markdown inline>_interpolated_ markdown</Markdown>
        </p>
      </div>
    );
  }
}

const container = document.createElement('div');
document.body.appendChild(container);

ReactDOM.render(<Example />, container);
