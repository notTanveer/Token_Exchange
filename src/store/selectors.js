import { createSelector } from 'reselect'
import { get, groupBy, reject, maxBy, minBy } from 'lodash';
import moment from 'moment'
import { ethers } from 'ethers';

const GREEN = '#25CE8F'
const RED = '#F45353'


const tokens = state => get(state, 'tokens.contracts')
const account = state => get(state, 'provider.account')

const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id.toString() === order.id.toString())
    const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString())
    return(orderFilled || orderCancelled)
  })

  return openOrders

}

// ---------------------------------------------------------------------------------------
// MY OPEN ORDERS

export const myOpenOrderSelector = createSelector(
  account,
  tokens,
  openOrders,
  (account, tokens, orders) => {
    if(!tokens[0] || !tokens[1]) { return }

    // Filters order created by our account
    orders = orders.filter((o) => o.user === account)

    // Filters order by token address
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

    // Decorate Orders & Display Attributes
    orders = decorateMyOpenOrders(orders, tokens)

    // Sort Orders By Date Descending
    orders = orders.sort((a,b) => b.timestamp - a.timestamp)

    console.log(orders)

    return orders
  }
)

const decorateMyOpenOrders = (orders, tokens) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order, tokens)
      order = decorateMyOpenOrder(order, tokens)
      return(order)
    })
  )
}

const decorateMyOpenOrder = (order, tokens) => {
  let orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

const decorateOrder = (order, tokens) => {
  let token0Amount, token1Amount

  // Note: DApp should be considered token0, mETH is considered token1
  // Example: Giving mETH in exchange for DApp
  if (order.tokenGive === tokens[1].address) {
    token0Amount = order.amountGive // The amount of DApp we are giving
    token1Amount = order.amountGet // The amount of mETH we want...
  } else {
    token0Amount = order.amountGet // The amount of DApp we want
    token1Amount = order.amountGive // The amount of mETH we are giving...
  }

  // Calculate token price to 5 decimal places
  const precision = 100000
  let tokenPrice = (token1Amount / token0Amount)
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return ({
    ...order,
    token1Amount: ethers.utils.formatUnits(token1Amount, "ether"),
    token0Amount: ethers.utils.formatUnits(token0Amount, "ether"),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D')
  })
}

// ------------------------------------------------------------------------------
// ALL FILLED ORDERS

export const filledOrdersSelectors = createSelector(
  filledOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {  return  }

    // Filter Orders By Selected Tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

    // Sort Orders by time ascending for price comparison
    orders = orders.sort((a,b) => a.timestamp - b.timestamp)

    // Decorate Orders
    orders = decorateFilledOrders(orders, tokens)

    // Sort orders again by date descending for display
    orders = orders.sort((a,b) => b.timestamp - a.timestamp)

    return orders

  }
)

const decorateFilledOrders = (orders, tokens) => {
  let previousOrder = orders[0] 
  return (
    orders.map((order) => {
    // decorate each and individual order
    order = decorateOrder(order, tokens)
    order = decorateFilledOrder(order, previousOrder)
    previousOrder = order
    return order
  })  
 )
}

const decorateFilledOrder = (order, previousOrder) => {
  return({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {

  if(previousOrder.id === orderId) { return GREEN }

  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN
  } else {
    return RED
  }

}

// ------------------------------------------------------------------------------
// ORDER BOOK

export const orderBookSelector = createSelector(
  openOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) { return }

    // Filter orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

    // Decorate orders
    orders = decorateOrderBookOrders(orders, tokens)

    // Group orders by "orderType"
    orders = groupBy(orders, 'orderType')

    // Fetch buy orders
    const buyOrders = get(orders, 'buy', [])

    // Sort buy orders by token price
     orders = {
        ...orders,
        buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
      }

    // Fetch sell orders
    const sellOrders = get(orders, 'sell', [])

    // Sort sell orders by token price
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    return orders
  }
)

const decorateOrderBookOrders = (orders, tokens) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order, tokens)
      order = decorateOrderBookOrder(order, tokens)
      return(order)
    })
  )
}

const decorateOrderBookOrder = (order, tokens) => {
  const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
  })
}

// -----------------------------------------------------------------------
// PRICE CHART

export const priceChartSelector = createSelector(
  filledOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {  return  }

    // Filters Orders by Selected Tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

    // Sort Orders by date ascending to compare history
    orders = orders.sort((a,b) => a.timestamp - b.timestamp)

    // Decorate Orders - add Display Attributes
    orders = orders.map((o) => decorateOrder(o, tokens))

    let lastOrder, secondLastOrder
    [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)

    const lastPrice = get(lastOrder, 'tokenPrice', 0)

    const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

    return({
      lastPrice,
      lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
      series: [{
        data: buildGraphData(orders) 
      }]
    })
  }
)


const buildGraphData = (orders) => {

  orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())

  const hours = Object.keys(orders)

  const graphData = hours.map((hour) => {
    // Fetch all orders from current hour
    const group = orders[hour]
  
    // Calculate price values : high low open close
    const open = group[0]
    const high = maxBy(group, 'tokenPrice')
    const low = minBy(group, 'tokenPrice')
    const close = group[group.length - 1]

    return({
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
    })
  })
  return graphData
}