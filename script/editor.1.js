const editField = document.getElementById('edit-field')

function createCaretPlacer(atStart) {
  return function (el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" &&
      typeof document.createRange !== "undefined") {
      var range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(atStart)
      var sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    } else if (typeof document.body.createTextRange !== "undefined") {
      var textRange = document.body.createTextRange()
      textRange.moveToElementText(el)
      textRange.collapse(atStart)
      textRange.select()
    }
  }
}

var placeCaretAtStart = createCaretPlacer(true)
var placeCaretAtEnd = createCaretPlacer(false)

function getCaretInfo() {
  const selection = document.getSelection()
  const range = selection.getRangeAt(0)
  const rangeString = selection.toString()
  const {
    type, // Caret, Range
    anchorNode, // 시작 노드
    anchorOffset, // 시작 점
    focusNode, // 끝 노드
    focusOffset // 끝 점
  } = selection

  let lineElement = null // 라인 DOM
  let elementWithAnchorNode = anchorNode // 라인 DOM 바로 하위 자식(출발을 포함한)
  let tmpParentElement = anchorNode
  for (;;) {
    if (tmpParentElement.parentNode === editField) {
      lineElement = tmpParentElement
      break
    }

    elementWithAnchorNode = tmpParentElement
    tmpParentElement = tmpParentElement.parentNode
  }

  let elementWithFocusNode = focusNode // 라인 DOM 바로 하위 자식(끝을 포함한)
  tmpParentElement = focusNode
  for (;;) {
    if (tmpParentElement.parentNode === editField) {
      break
    }

    elementWithFocusNode = tmpParentElement
    tmpParentElement = tmpParentElement.parentNode
  }

  let prevElement = elementWithAnchorNode
  let startCaret = anchorOffset
  for (;;) {
    if (prevElement.previousSibling === null)
      break

    prevElement = prevElement.previousSibling
    startCaret += prevElement.textContent.length
  }

  prevElement = elementWithFocusNode
  let endCaret = focusOffset
  for (;;) {
    if (prevElement.previousSibling === null)
      break

    prevElement = prevElement.previousSibling
    endCaret += prevElement.textContent.length
  }

  let tmp = startCaret
  startCaret = startCaret > endCaret ? endCaret : startCaret
  endCaret = tmp > endCaret ? tmp : endCaret

  let result = {
    type,
    range,
    selection,
    anchorNode,
    anchorOffset,
    elementWithAnchorNode,
    focusOffset,
    elementWithFocusNode,
    startCaret,
    endCaret,
    rangeString,
    lineElement,
    isLast: lineElement.textContent.length === (startCaret > endCaret ? startCaret : endCaret),
    lineTextLength: lineElement.textContent.length
  }

  return result
}

function unSurroundContents(tagName) {

}

function getSurroundTargets(tagName) {
  const caretInfo = getCaretInfo()
  const {
    selection,
    range,
    anchorOffset,
    elementWithAnchorNode,
    elementWithFocusNode
  } = caretInfo
  const {
    startContainer,
    endContainer
  } = range

  let surround = []
  let surroundRange = false
  let unSurround = []
  let cloneChildNodes = null

  const _getSurroundTarget = (childNodes, tagName) => {
    let childNodesLen = childNodes.length
  
    for (let i = 0; i < childNodesLen; i++) {
      let childNode = childNodes[i]
  
      if (childNode.tagName === undefined) {
        surround.push(childNode)
      } else {
        if (childNode.tagName === tagName) {
          continue
        }
  
        _getSurroundTarget(childNode.childNodes, tagName)
      }
    }
  }

  if (startContainer === endContainer) {
    if (elementWithAnchorNode.tagName !== tagName) {
      surroundRange = true
    } 
  } else {
    let { childNodes } = range.cloneContents()
    cloneChildNodes = childNodes
    _getSurroundTarget(childNodes, tagName)
  }

  return {
    surround,
    surroundRange,
    unSurround,
    caretInfo,
    cloneChildNodes
  }
}

function _surround(tagName) {
  const {
    activeElement
  } = document

  if (activeElement !== editField || document.getSelection().toString().trim() === '') 
    return false
    
  let isSurrounded = false
  let surroundTargets = getSurroundTargets(tagName)
  const {
    selection,
    range,
    anchorOffset,
    anchorNode,
    elementWithAnchorNode,
    elementWithFocusNode
  } = surroundTargets.caretInfo

  isSurrounded = (surroundTargets.surroundRange || surroundTargets.surround.length > 0) ? false : true

  console.log(`isSurrounded : ${isSurrounded}`)

  // 1개라도 감싸지지 않은 것이 있을 경우 Surround
  if (!isSurrounded) {
    if (surroundTargets.surroundRange === true) {
      range.surroundContents(document.createElement(tagName))
    } else {
      surroundTargets.surround.forEach((node, i) => {
        let newRange = document.createRange()
        newRange.selectNode(node)
        newRange.surroundContents(document.createElement(tagName))
      })

      range.extractContents()
      $(elementWithAnchorNode).after(surroundTargets.cloneChildNodes)
    }
  }
  // 이미 감싸져 있는 경우 UnSurround
  else {
    const {
      startContainer,
      endContainer
    } = range
    
    if (elementWithAnchorNode === elementWithFocusNode) {
      const startContainerParentNode = startContainer.parentNode

      range.surroundContents(document.createElement('span'))
      let parentNodeOuterHTML = startContainerParentNode.outerHTML
      parentNodeOuterHTML = parentNodeOuterHTML.replace('<span>', `</${tagName}>`)
      parentNodeOuterHTML = parentNodeOuterHTML.replace('</span>', `<${tagName}>`)
      startContainerParentNode.outerHTML = parentNodeOuterHTML
    } else {
      
      console.log('11111')
    }
    unSurroundContents(tagName)
  }
}

window.onload = function () {
  editField.addEventListener('keypress', (e) => enterKey(e))
  b.addEventListener('mousedown', () => bClick())
  h2.addEventListener('mousedown', () => hClick('h2'))
  h3.addEventListener('mousedown', () => hClick('h3'))
  h4.addEventListener('mousedown', () => hClick('h4'))
  pre.addEventListener('mousedown', () => preClick())

  function enterKey(e) {
    if (e.which !== 13 || e.shiftKey) return true

    const caretInfo = getCaretInfo()
    const {
      type,
      isLast,
      range,
      lineElement
    } = caretInfo
    if (!isLast) return true

    if (type === 'Range' && isLast) {
      range.deleteContents()
    }

    const p = document.createElement('p')
    const br = document.createElement('br')
    p.appendChild(br)
    lineElement.after(p)
    setTimeout(function () {
      placeCaretAtStart(p)
    }, 0)

    e.preventDefault()
    return false
  }

  function bClick() {
    _surround('B')
  }
  

  function hClick(name) {
    const {
      activeElement
    } = document

    if (activeElement === editField) {
      const selection = document.getSelection()
      const {
        anchorNode,
        type
      } = selection
      const anchorNodeType = anchorNode.nodeType

      const h = document.createElement(name)
      const br = document.createElement('br')
      h.appendChild(br)

      if (type === 'Caret') {
        if (anchorNodeType === 1) {
          activeElement.replaceChild(h, anchorNode)
        }

        setTimeout(function () {
          activeElement.focus()
        }, 0)
      }
    }
  }

  function preClick() {
    const {
      activeElement
    } = document

    if (activeElement !== editField) return false

    const selection = document.getSelection()
    const {
      anchorNode,
      type
    } = selection
    const anchorNodeType = anchorNode.nodeType

    const p = document.createElement('p')
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    const br = document.createElement('br')
    p.appendChild(pre)
    pre.appendChild(code)
    code.appendChild(br)

    if (type === 'Caret') {
      if (anchorNodeType === 1) {
        activeElement.replaceChild(pre, anchorNode)
      }

      setTimeout(function () {
        activeElement.focus()
      }, 0)
    }
  }
}




/*
function _surround(childNodes, tagName) {
  let childNodesLen = childNodes.length

  for (let i = 0; i < childNodesLen; i++) {
    let childNode = childNodes[i]

    if (childNode.tagName === undefined) {
      let newRange = document.createRange()
      newRange.selectNode(childNode)
      newRange.surroundContents(document.createElement(tagName))
    } else {
      if (childNode.tagName === tagName) 
        continue

      _surround(childNode.childNodes, tagName)
    }
  }
}

function surroundContents(tagName) {
  const {
    activeElement
  } = document

  if (activeElement === editField) {
    const {
      selection,
      range,
      anchorNode,
      anchorOffset,
      elementWithAnchorNode,
      elementWithFocusNode
    } = getCaretInfo()
    const {
      startContainer,
      endContainer
    } = range

    if (startContainer === endContainer) {
      // 이미 해당 태그 내부라면 return 
      if (elementWithAnchorNode.tagName === tagName) 
        return true

      let { childNodes } = range.extractContents()
      let childNode = childNodes[0]
      let newRange = document.createRange()
      newRange.selectNode(childNode)
      newRange.surroundContents(document.createElement(tagName))
      newRange.setStart(anchorNode, anchorOffset)
      newRange.insertNode(childNodes[0])

      // range.surroundContents(document.createElement(tagName))
    } else {
      let { childNodes } = range.extractContents()

      _surround(childNodes, tagName)
      $(elementWithAnchorNode).after(childNodes)
    }
  }
}
*/