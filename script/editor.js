const editField = document.getElementById('edit-field')

function createCaretPlacer(atStart) {
  return function (el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" &&
      typeof document.createRange !== "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(atStart);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange !== "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(atStart);
      textRange.select();
    }
  };
}

var placeCaretAtStart = createCaretPlacer(true);
var placeCaretAtEnd = createCaretPlacer(false);

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
      break;

    prevElement = prevElement.previousSibling
    startCaret += prevElement.textContent.length
  }

  prevElement = elementWithFocusNode
  let endCaret = focusOffset
  for (;;) {
    if (prevElement.previousSibling === null)
      break;

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

function surroundContents(tagName) {
  const {
    activeElement
  } = document

  if (activeElement === editField) {
    const {
      selection,
      range,
      anchorOffset,
      elementWithAnchorNode,
      elementWithFocusNode
    } = getCaretInfo()
    const {
      startContainer,
      endContainer
    } = range

    if (range.toString() === '') 
      return true

    var surroundFn = (nodes) => {
      let nodesLen = nodes.length

      for (let i = 0; i < nodesLen; i++) {
        let node = nodes[i]
  
        if (node.tagName === undefined) {
          let newRange = document.createRange()
          newRange.selectNode(node)
          newRange.surroundContents(document.createElement(tagName))
        } else {
          if (node.tagName === tagName) 
            continue
  
          surroundFn(node.childNodes)
        }
      }
    }

    if (startContainer === endContainer) {
      // 이미 B 태그 내부라면 return 
      if (elementWithAnchorNode.tagName === tagName) 
        return true;

      range.surroundContents(document.createElement(tagName))
    } else {
      let { childNodes } = range.extractContents()

      surroundFn(childNodes)
      $(elementWithAnchorNode).after(childNodes)
    }
  }
}

function unSurroundContents(tagName) {

}

function surround(tagName) {
  let isSurrounded = false;

  // 감싸져 있지 않을 경우 Surround
  if (!isSurrounded)
    surroundContents(tagName)
  // 이미 감싸져 있는 경우 UnSurround
  else
    unSurroundContents(tagName)
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

    const caretInfo = getCaretInfo();
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
    surround('B')
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
