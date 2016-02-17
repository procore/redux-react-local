import React, { Component, PropTypes } from 'react'

// redux
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'

// redux-saga
import createSagaMiddleware from 'redux-saga'
import { Sagas } from 'react-redux-saga'

// optimist
import optimist from 'redux-optimist'
import { Optimist } from 'react-redux-optimist'

// redux-react-local
import { reducer } from '../src'

// fsa
import ensureFSA from './ensure-fsa'

// perf
import { batchedSubscribe } from 'redux-batched-subscribe'
import { unstable_batchedUpdates } from 'react-dom'

function makeStore(reducers = {}, initial = {}, middleware = []) {
  // create a redux store
  return createStore(
    // reducer
    optimist(combineReducers({
      ...reducers || {},
      local: reducer
    })),
    // initial state
    initial || {},
    // middleware
    compose(applyMiddleware(...middleware), batchedSubscribe(unstable_batchedUpdates))
  )
}


export default class Root extends Component {
  // optionally accept middleware/reducers to add on to the redux store
  static propTypes = {
    middleware: PropTypes.array,
    reducers: PropTypes.object
  };

  *middle() {
    if (this.props.middleware) {
      yield* this.props.middleware
    }
    yield this.sagaMiddleware
    if (process.env.NODE_ENV === 'development') {
      yield ensureFSA
    }
  }

  sagaMiddleware = createSagaMiddleware()

  store = makeStore(
    this.props.reducers,
    this.props.initial,
    this.middle()
  )

  render() {
    return <Provider store={this.store}>
      <Sagas middleware={this.sagaMiddleware}>
        <Optimist>
          {this.props.children}
        </Optimist>
      </Sagas>
    </Provider>
  }
}
