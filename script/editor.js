window.onload = function () {
  const editField = document.getElementById('edit-field');

  editField.addEventListener('keypress', (e) => {
    enterKey(e)
  })

  b.addEventListener('mousedown', () => {
    bClick()
  })

  h2.addEventListener('mousedown', () => {
    h2Click()
  })

  function enterKey(e) {
    if (e.which !== 13) return true
    if (!getIsLastCaret()) return true
   console.log('test');
    const p = document.createElement('p')
    const br = document.createElement('br')
    p.appendChild(br)
    editField.appendChild(p)
    setTimeout(function () {
      placeCaretAtStart(p)
    }, 0)

    e.preventDefault()
    return false
  }

  function bClick() {
    const {
      activeElement
    } = document

    if (activeElement === editField) {
      const selection = document.getSelection()
      const range = selection.getRangeAt(0)
      const {
        startContainer,
        endContainer
      } = range

      if (startContainer === endContainer) {
        range.surroundContents(document.createElement('b'))
      }
    }
  }

  function h2Click() {
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

      const h2 = document.createElement('h2')
      const br = document.createElement('br')
      h2.appendChild(br)

      if (type === 'Caret') {
        if (anchorNodeType === 1) {
          activeElement.replaceChild(h2, anchorNode)
        }

        setTimeout(function () {
          activeElement.focus()
        }, 0)
      }
    }
  }

  function getIsLastCaret() {
    let isLast = true

    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const rangeString = selection.toString()
    const {
      type,         // Caret, Range
      anchorNode,   // 시작 노드
      anchorOffset, // 시작 점
      focusNode,    // 끝 노드
      focusOffset   // 끝 점
    } = selection

    let lineElement = null
    let elementWithAnchorNode = anchorNode
    let tmpParentElement = anchorNode
    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        lineElement = tmpParentElement
        break
      }

      elementWithAnchorNode = tmpParentElement
      tmpParentElement = tmpParentElement.parentNode
    }
    
    let elementWithFocusNode = focusNode
    tmpParentElement = focusNode
    for (;;) {
      if (tmpParentElement.parentNode === editField) {
        break
      }

      elementWithFocusNode = tmpParentElement
      tmpParentElement = tmpParentElement.parentNode
    }

    /**
     * type: Caret 
     */
    if (type === 'Caret') {
      /**
       * 우측 Siblings 객체가 있고, Siblings 객체 내부에 텍스트가 있을 경우 (isLast: false)
       */
      let tmpNextSibling = elementWithAnchorNode.nextSibling
      for (;;) {
        if (tmpNextSibling !== null) {
          const {
            textContent
          } = tmpNextSibling
          if (textContent !== '') {
            isLast = false
            break
          }
  
          tmpNextSibling = tmpNextSibling.nextSibling
        } else {
          break
        }
      }

      if (anchorOffset !== elementWithAnchorNode.textContent.length) {
        isLast = false
      }

      return isLast
    }
    
    /**
     * type: Range 
     */
    if (type === 'Range') {

    }

    return isLast
  }

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
}