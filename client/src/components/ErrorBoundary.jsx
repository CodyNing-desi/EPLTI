import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">⚽</p>
            <h2 className="text-lg font-bold text-gray-900 mb-2">出了点问题</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              页面遇到一个意外错误，可能是网络波动或数据异常。请尝试刷新页面。
            </p>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.href = '/'
              }}
              className="px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition shadow-sm"
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
