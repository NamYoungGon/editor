(function (window, $) {
  function setRange(startNode, startOffset, endNode, endOffset){
    let newRange = document.createRange()
    newRange.setStart(startNode, startOffset)
    newRange.setEnd(endNode, endOffset)

    return newRange
  }

  function selectRange(node) {
    let newRange = document.createRange()
    newRange.selectNode(node)

    return newRange
  }

  function tmpSpan(id) {
    const span = document.createElement('span')
    span.id = id || 'tmpspan'

    return span
  }

/**
 * 
 * @param {DOM} node 대상 DOM
 * @param {Boolean} isSelf 자신을 unWrap 할지에 대한 여부
 */
  function unWrap(node, isSelf) {
    if (!isSelf) {
      $(node).unwrap()
    } else {
      $(node).replaceWith(node.innerHTML)
    }

  }

  function getSelectionInfo(editField) {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const rangeStringSplit = selection.toString().split('\n').filter((d) => d !== '')
    const rangeStringSplitLen = rangeStringSplit.length
    let {
      anchorNode, // 시작 노드
      anchorOffset, // 시작 점
      focusNode, // 끝 노드
      focusOffset // 끝 점
    } = selection
    let startNode = anchorNode
    let startOffset = anchorOffset
    let endNode = focusNode
    let endOffset = focusOffset

    let lines = [] // 라인 Object
    let lineWithStartNode = null
    let lineWithEndNode = null
    let lineWithStartNodeIndex = -1
    let lineWithEndNodeIndex = -1

    lineWithStartNode = _getLineWithNodeFn(startNode, editField)
    lineWithEndNode = _getLineWithNodeFn(endNode, editField)

    let editFieldChildren = Array.from(editField.children)
    lineWithStartNodeIndex = editFieldChildren.findIndex((child) => child === lineWithStartNode)
    lineWithEndNodeIndex = editFieldChildren.findIndex((child) => child === lineWithEndNode)

    if (lineWithEndNodeIndex < lineWithStartNodeIndex) {
      let tmp = null; 
      tmp = lineWithStartNode; lineWithStartNode = lineWithEndNode; lineWithEndNode = tmp
      tmp = lineWithStartNodeIndex; lineWithStartNodeIndex = lineWithEndNodeIndex; lineWithEndNodeIndex = tmp
      tmp = startNode; startNode = endNode; endNode = tmp
      tmp = startOffset; startOffset = endOffset; endOffset = tmp;
    }

    let initStartNode = startNode
    let initStartOffset = startOffset
    let initEndNode = endNode
    let initEndOffset = endOffset

    let lineChildWithStartNode = null // 라인 DOM 바로 하위 자식(출발을 포함한)
    let lineChildWithEndNode = null // 라인 DOM 바로 하위 자식(끝을 포함한)

    let lineElement
    let type
    let rangeString
    let isLast
    let lineObj
    for (let i = 0; i < rangeStringSplitLen; i++) {
      rangeString = rangeStringSplit[i]

      // 한줄일 경우
      if (rangeStringSplitLen - 1 === 0) {
        lineElement = lineWithStartNode
        type = selection.type

        lineChildWithStartNode = getLineChildWithNodeFn(startNode, editField)
        lineChildWithEndNode = getLineChildWithNodeFn(endNode, editField)
      } 
      // Range 가 다수의 줄로 구성되어 있을 경우
      else {
        isLast = false
        type = 'Range'

        // 첫 번째 줄일 경우
        if (i === 0) {
          lineElement = lineWithStartNode

          let endObj = _getEndObjFn(lineElement, editField)
          endNode = endObj.endNode
          endOffset = endObj.endOffset
          lineChildWithEndNode = endObj.lineChildWithEndNode
          lineChildWithStartNode = getLineChildWithNodeFn(startNode, editField)
        }
        // 마지막 줄일 경우
        else if (i === rangeStringSplitLen - 1) {
          lineElement = lineWithEndNode

          let startObj = getStartObjFn(lineElement, editField)
          startNode = startObj.startNode
          startOffset = startObj.startOffset
          lineChildWithStartNode = startObj.lineChildWithStartNode
          endNode = initEndNode
          endOffset = initEndOffset
          lineChildWithEndNode = getLineChildWithNodeFn(endNode, editField)
        } 
        // 중간 줄일 경우
        else {
          lineElement = lineElement.nextElementSibling

          let startObj = getStartObjFn(lineElement, editField)
          startNode = startObj.startNode
          startOffset = startObj.startOffset
          lineChildWithStartNode = startObj.lineChildWithStartNode

          let endObj = _getEndObjFn(lineElement, editField)
          endNode = endObj.endNode
          endOffset = endObj.endOffset
          lineChildWithEndNode = endObj.lineChildWithEndNode
        }
      }

      lines.push({
        lineElement,
        type,
        rangeString,
        isLast,

        startNode,
        startOffset,
        lineChildWithStartNode,
        endNode,
        endOffset,
        lineChildWithEndNode
      })
    }

    return lines
  }

  function getCaretInfo(editField) {
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

  /**
   * 
   * @param {DOM} node 텍스트를 감싸고 있는 element
   * @param {Number} offset element 내부 offset
   * @param {DOM} editField 
   * @returns {Object} CaretIndex, lineElement
   * @description offset 을 이용하여 line 에 해당하는 Caret index, element 를 반환한다.
   */
  function getCaretByOffset(node, offset, editField) {
    let caretIndex = offset
    let tmpParentElement = node
    let lineElement

    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        lineElement = tmpParentElement
        break
      }

      tmpParentElement = tmpParentElement.parentNode
    }

    let prevElement = node
    if (node.textContent.length === node.parentNode.textContent.length) {
      prevElement = node.parentNode
    }

    const tmpFn = (tmpPrevElement) => {
      for (;;) {
        if (tmpPrevElement === lineElement || tmpPrevElement.previousSibling === null)
          break
  
        tmpPrevElement = tmpPrevElement.previousSibling
        caretIndex += tmpPrevElement.textContent.length
      }

      if (tmpPrevElement.parentNode !== lineElement && tmpPrevElement.parentNode !== editField)
        tmpFn(tmpPrevElement.parentNode)
    }

    tmpFn(prevElement)

    return {
      caretIndex,
      lineElement
    }
  }

  /**
   * 
   * @param {DOM} lineElement 
   * @param {Number} caretIndex 
   * @param {DOM} editField 
   */
  function getCaretByIndex(lineElement, caretIndex, isStart) {
    let node
    let offset
    let { childNodes } = lineElement
    let tmpCaretIndex = 0

    const _textChildFn = (childNodes) => {
      if (offset) return true

      const childNodesLen = childNodes.length

      for (let i = 0; i < childNodesLen; i++) {
        let childNode = childNodes[i]
    
        if (childNode.tagName === undefined && childNode.textContent !== '') {
          if (isStart === true && caretIndex < tmpCaretIndex + childNode.textContent.length) {
            node = childNode
            // offset = tmpCaretIndex - caretIndex
            offset = caretIndex - tmpCaretIndex

            return true
          } else if (isStart === false && caretIndex <= tmpCaretIndex + childNode.textContent.length) {
            node = childNode
            offset = caretIndex - tmpCaretIndex

            return true
          }
  
          tmpCaretIndex += childNode.textContent.length
        } else {
          let result = _textChildFn(childNode.childNodes)
          if (result === true)
            break
        }
      }
    }

    _textChildFn(childNodes)

    return {
      node,
      offset
    }
  }

  /**
   *  라인의 startNode, startOffset 정보를 반환
   */
  function getStartObjFn(lineElement, editField) {
    let startNode
    let lineChildWithStartNode
    let { childNodes } = lineElement

    const _textChildFn = (childNodes) => {
      const childNodesLen = childNodes.length

      for (let i = 0; i < childNodesLen; i++) {
        let childNode = childNodes[i]
    
        if (childNode.tagName === undefined && childNode.textContent !== '') {
          startNode = childNode
          return true
        } else {
          let result = _textChildFn(childNode.childNodes)
          if (result === true)
            break
        }
      }
    }

    _textChildFn(childNodes)

    lineChildWithStartNode = startNode
    tmpParentElement = startNode
    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        break
      }

      lineChildWithStartNode = tmpParentElement
      tmpParentElement = tmpParentElement.parentNode
    }

    return {
      startNode,
      startOffset: 0,
      lineChildWithStartNode
    }
  }

  /**
   *  라인의 endNode, endOffset 정보를 반환
   */
  function _getEndObjFn(lineElement, editField) {
    let endNode
    let endOffset
    let lineChildWithEndNode
    let { childNodes } = lineElement

    const _textChild = (childNodes) => {
      const childNodesLen = childNodes.length

      for (let i = childNodesLen - 1; i >= 0; i--) {
        let childNode = childNodes[i]

        if (childNode.tagName === undefined && childNode.textContent !== '') {
          endNode = childNode
          endOffset = childNode.textContent.length
          return true
        } else {
          let result = _textChild(childNode.childNodes)
          if (result === true)
            break
        }
      }
    }

    _textChild(childNodes)

    lineChildWithEndNode = endNode
    tmpParentElement = endNode
    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        break
      }

      lineChildWithEndNode = tmpParentElement
      tmpParentElement = tmpParentElement.parentNode
    }

    return {
      endNode,
      endOffset,
      lineChildWithEndNode
    }
  }

  /**
   *  해당 객체를 가지고 있는 라인을 반환
   */
  function _getLineWithNodeFn(node, editField) {
    let tmpParentElement = node
    let lineWithStartNode = null
    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        lineWithStartNode = tmpParentElement
        break
      }

      tmpParentElement = tmpParentElement.parentNode
    }

    return lineWithStartNode
  }

  /**
   *  해당 객체를 가지고 있는 라인의 자식을 반환
   */
  function getLineChildWithNodeFn(node, editField) {
    let tmpParentElement = node
    let lineChildWithStartNode = null
    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        lineWithStartNode = tmpParentElement
        break
      }

      lineChildWithStartNode = tmpParentElement
      tmpParentElement = tmpParentElement.parentNode
    }

    return lineChildWithStartNode
  }

  function isContainsTagName(lastElement, initElement, tagName) {
    let result = false
    let compareElement = initElement.parentNode

    if (lastElement === initElement)
      return result

    for (;;) {
      if (compareElement.tagName === tagName) {
        result = true
        break
      }

      if (lastElement === compareElement)
        break

      compareElement = compareElement.parentNode
    }

    return result
  }

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

  const placeCaretAtStart = createCaretPlacer(true);
  const placeCaretAtEnd = createCaretPlacer(false);

  function Editor(containerQuery) {
    const container = document.querySelector(containerQuery);

    this.init(container);
  }

  Editor.prototype = {
    init: function (container) {
      this._setElement(container);

      this._event();
    },

    _setElement: function (container) {
      const editField = container.querySelector('#edit-field');
      // editField.innerHTML = '<p><br/></p>';

      this.el = {
        container,
        editField
      };
    },

    _event: function () {
      const {
        editField
      } = this.el;

      editField.addEventListener('keypress', (e) => enterKey.call(this, e))
      b.addEventListener('mousedown', () => bClick.call(this))
      em.addEventListener('mousedown', () => emClick.call(this))
      h2.addEventListener('mousedown', () => hClick.call(this, 'h2'))
      h3.addEventListener('mousedown', () => hClick.call(this, 'h3'))
      h4.addEventListener('mousedown', () => hClick.call(this, 'h4'))
      pre.addEventListener('mousedown', () => preClick.call(this))

      function enterKey(e) {
        if (e.which !== 13 || e.shiftKey) return true

        const {
          type,
          isLast,
          range,
          lineElement
        } = getCaretInfo(editField)

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
        this._surround('B')
      }

      function emClick() {
        this._surround('EM')
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
    },

    _getSurroundTargets(tagName) {
      const {
        editField
      } = this.el;

      const selectionInfo = getSelectionInfo(editField)
      const result = []
 
      selectionInfo.forEach((info, i) => {
        const {
          lineElement,
          type,
          rangeString,
          isLast,
          startNode,
          startOffset,
          lineChildWithStartNode,
          endNode,
          endOffset,
          lineChildWithEndNode
        } = info

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

        if (startNode === endNode) {
          // if (lineChildWithStartNode.tagName !== tagName) {
          if (!isContainsTagName(lineChildWithStartNode, startNode, tagName)) {
            surroundRange = true
          } 
        } else {
          const newRange = setRange(startNode, startOffset, endNode, endOffset)
          let { childNodes } = newRange.cloneContents()
          cloneChildNodes = childNodes
          _getSurroundTarget(childNodes, tagName)
        }

        result.push({
          surround,
          surroundRange,
          unSurround,
          info,
          cloneChildNodes
        })
      })

      return result
    },

    _unSurroundContents: function (tagName) {

    },

    _surround: function (tagName) {
      const {
        activeElement
      } = document

      const {
        editField
      } = this.el;

      const selection = document.getSelection()
      let range = selection.getRangeAt(0)
      
      if (document.getSelection().toString().trim() === '' || editField.contains(range.commonAncestorContainer) === false) 
        return false

      const lowerTagName = tagName.toLowerCase()

      let getStartCaret = getCaretByOffset(selection.anchorNode, selection.anchorOffset, editField)
      let startCaretIndex = getStartCaret.caretIndex
      let startCaretLineElement = getStartCaret.lineElement
      let getEndCaret = getCaretByOffset(selection.focusNode, selection.focusOffset, editField)
      let endCaretIndex = getEndCaret.caretIndex
      let endCaretLineElement = getEndCaret.lineElement

      let isSurrounded = false
      let surroundTargets = this._getSurroundTargets(tagName)

      let totalIsSurrounded = true
      surroundTargets.forEach((surroundTarget) => {
        if (surroundTarget.surroundRange || surroundTarget.surround.length > 0) {
          totalIsSurrounded = false
        }
      })

      surroundTargets.forEach((surroundTarget) => {
        const {
          startNode,
          startOffset,
          endNode,
          endOffset,
          lineChildWithStartNode,
          lineChildWithEndNode
        } = surroundTarget.info

        isSurrounded = (surroundTarget.surroundRange || surroundTarget.surround.length > 0) ? false : true

        console.log(`isSurrounded : ${isSurrounded}`)

        if (totalIsSurrounded === false && isSurrounded === true)
          return true

        // 1개라도 감싸지지 않은 것이 있을 경우 Surround
        if (isSurrounded === false) {
          if (surroundTarget.surroundRange === true) {
            const newRange = setRange(startNode, startOffset, endNode, endOffset)
            newRange.surroundContents(document.createElement(tagName))
          } else {
            surroundTarget.surround.forEach((node, i) => {
              let newRange = document.createRange()
              newRange.selectNode(node)
              newRange.surroundContents(document.createElement(tagName))
            })

            const extractRange = setRange(startNode, startOffset, endNode, endOffset)
            extractRange.extractContents()
            $(lineChildWithStartNode).after(surroundTarget.cloneChildNodes)
          }
        } else {
        // 이미 감싸져 있는 경우 UnSurround
          if (lineChildWithStartNode === lineChildWithEndNode) {
            if (startNode.parentNode.tagName === tagName) {
              const startNodeParentNode = startNode.parentNode
              const newRange = setRange(startNode, startOffset, endNode, endOffset)
              newRange.surroundContents(document.createElement('span'))
              let parentNodeOuterHTML = startNodeParentNode.outerHTML
              parentNodeOuterHTML = parentNodeOuterHTML.replace('<span>', `</${lowerTagName}>`)
              parentNodeOuterHTML = parentNodeOuterHTML.replace(`<${lowerTagName}></${lowerTagName}>`, '')
              parentNodeOuterHTML = parentNodeOuterHTML.replace('</span>', `<${lowerTagName}>`)
              parentNodeOuterHTML = parentNodeOuterHTML.replace(`<${lowerTagName}></${lowerTagName}>`, '')
              startNodeParentNode.outerHTML = parentNodeOuterHTML
            } else {
              const newRange = setRange(startNode, startOffset, endNode, endOffset)
              newRange.surroundContents(tmpSpan('rangeWrap'))

              let cloneContents
              let parentNode = startNode.parentNode
              for (;;) {
                if (parentNode.tagName === tagName) {
                  let newRange = selectRange(parentNode)
                  newRange.surroundContents(tmpSpan('tmpWrap'))
                  cloneContents = newRange.cloneContents()
                  break
                }

                parentNode = parentNode.parentNode
              }

              let wrapOuterHTML = cloneContents.firstChild.outerHTML
              parentNode = cloneContents.getElementById('rangeWrap').parentNode
              for (;;) {
                let parentNodeTagName = parentNode.tagName.toLowerCase()
                wrapOuterHTML = wrapOuterHTML.replace('<span id="rangeWrap">', `</${parentNodeTagName}><span id="rangeWrap">`)
                wrapOuterHTML = wrapOuterHTML.replace('</span>', `</span><${parentNodeTagName}>`)
                
                if (parentNode.tagName === tagName) {
                  break
                }

                wrapOuterHTML = wrapOuterHTML.replace('<span id="rangeWrap">', `<span id="rangeWrap"><${parentNodeTagName}>`)
                wrapOuterHTML = wrapOuterHTML.replace('</span>', `</${parentNodeTagName}></span>`)

                parentNode = parentNode.parentNode
              }              

              wrapOuterHTML = wrapOuterHTML.substring('<span id="tmpWrap">'.length, wrapOuterHTML.length - 7)
              document.getElementById('tmpWrap').innerHTML = wrapOuterHTML

              unWrap(document.getElementById('tmpWrap'), true)
              unWrap(document.getElementById('rangeWrap'), true)
            }
          } else {
            let childNodesHTML = ''
            surroundTarget.cloneChildNodes.forEach((node, i) => {
              let nodeOuterHTML = node.outerHTML
              nodeOuterHTML = nodeOuterHTML.replace(`<${lowerTagName}>`, '')
              nodeOuterHTML = nodeOuterHTML.replace(`</${lowerTagName}>`, '')
  
              childNodesHTML += nodeOuterHTML
            })
            let tmpSpan = document.createElement('span')
            const extractRange = setRange(startNode, startOffset, endNode, endOffset)
            extractRange.extractContents()
  
            tmpSpan.innerHTML = childNodesHTML
            
            extractRange.insertNode(tmpSpan)
  
            let tmpSpanOuterHTML = tmpSpan.outerHTML
            tmpSpanOuterHTML = tmpSpanOuterHTML.replace('<span>', '')
            tmpSpanOuterHTML = tmpSpanOuterHTML.replace('</span>', '')
            tmpSpan.outerHTML = tmpSpanOuterHTML
  
            this._unSurroundContents(tagName)
          }
        }
      })
debugger
      getStartCaret = getCaretByIndex(startCaretLineElement, startCaretIndex, true)
      const startCaretNode = getStartCaret.node
      const startCaretOffset = getStartCaret.offset
      getEndCaret = getCaretByIndex(endCaretLineElement, endCaretIndex, false)
      const endCaretNode = getEndCaret.node
      const endCaretOffset = getEndCaret.offset
 
      let tmpRange = setRange(startCaretNode, startCaretOffset, endCaretNode, endCaretOffset)
      selection.removeAllRanges()
      selection.addRange(tmpRange)
    }
  };

  window.Editor = Editor;
})(window, jQuery)