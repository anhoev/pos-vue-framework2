import { computed, reactive } from '@vue/composition-api';

// calculate top/left and activator/content dimensions
// requires template refs: activator, content
// todo: rename
export default function menuable(props, context) {
  const menuableState = reactive({
    pageYOffset: 0,
    pageWidth: 0
  })

  const dimensions = reactive({
    activator: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      offsetTop: 0,
      scrollHeight: 0,
      offsetLeft: 0,
    },
    content: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      offsetTop: 0,
      scrollHeight: 0,
      offsetLeft: 0,
    }
  });

  const computedTop = computed(() => {
    const activatorDimensions = dimensions.activator;
    const contentDimensions = dimensions.content;
    let top = 0;

    if (props.top) {
      top += activatorDimensions.height - contentDimensions.height;
    }
    if (props.offsetY) {
      top += props.top ? -activatorDimensions.height : activatorDimensions.height;
    }
    top += activatorDimensions.top + menuableState.pageYOffset;

    return top;
  });

  const computedLeft = computed(() => {
    const activatorDimensions = dimensions.activator;
    const contentDimensions = dimensions.content;

    const activatorLeft = activatorDimensions.left || 0
    const minWidth = Math.max(activatorDimensions.width, contentDimensions.width);
    let left = 0;
    left += props.left ? activatorLeft - (minWidth - activatorDimensions.width) : activatorLeft;
    if (props.offsetX) {
      //todo calc maxWidth using prop
      const maxWidth = isNaN(Number(props.maxWidth))
        ? activatorDimensions.width
        : Math.min(activatorDimensions.width, Number(props.maxWidth))

      left += props.left ? -maxWidth : activatorDimensions.width
    }

    return left;
  });

  function calcXOverflow(left, menuWidth) {
    const xOverflow = left + menuWidth - menuableState.pageWidth;

    if ((!props.left || props.right) && xOverflow > 0) {
      left = Math.max(left - xOverflow, 0)
    }
    return left
  }

  function calcYOverFlow(top) {
    const { pageYOffset } = menuableState
    const documentHeight = window.innerHeight || document.documentElement.clientHeight
    const toTop = pageYOffset + documentHeight
    const activator = dimensions.activator
    const contentHeight = dimensions.content.height
    const totalHeight = top + contentHeight
    const isOverflowing = toTop < totalHeight

    if (isOverflowing && props.offsetOverflow && activator.top > contentHeight) {
      top = pageYOffset + (activator.top - contentHeight)
    } else if (isOverflowing && !props.allowOverflow) {
      top = toTop - contentHeight
    } else if (top < pageYOffset && !props.allowOverflow) {
      top = pageYOffset
    }

    return top
  }

  const isOutOfViewport = (elem) => {
    const bounding = elem.getBoundingClientRect();
    const out = {};
    out.top = bounding.top < 0;
    out.left = bounding.left < 0;
    out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
    out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);

    return out;
  };


  function updateDimensions() {
    menuableState.pageYOffset = window.pageYOffset || document.documentElement.scrollTop;
    menuableState.pageWidth = document.documentElement.clientWidth
    //measure activator
    const activatorElement = context.refs.activator;
    if (activatorElement) {
      dimensions.activator = {
        ...measure(activatorElement),
        offsetLeft: activatorElement.offsetLeft,
        offsetTop: activatorElement.offsetTop
      }
    }
    //measure content
    sneakPeek(() => {
      dimensions.content = measure(context.refs.content);
    })
  }

  function sneakPeek(cb) {
    requestAnimationFrame(() => {
      const contentElement = context.refs.content;
      if (!contentElement || contentElement.style.display !== 'none') {
        cb();
        return;
      }
      contentElement.style.display = 'inline-block';
      cb();
      contentElement.style.display = 'none';
    })
  }

  function measure(el) {
    if (!el) return
    const rect = getRoundedBoundedClientRect(el);

    if (props.attach) {
      const style = window.getComputedStyle(el);
      rect.left = parseInt(style.marginLeft);
      rect.top = parseInt(style.marginTop);
    }

    return rect
  }

  function getRoundedBoundedClientRect(el) {
    const rect = el.getBoundingClientRect();
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      bottom: Math.round(rect.bottom),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
  }

  return {
    computedLeft,
    computedTop,
    calcXOverflow,
    calcYOverFlow,
    updateDimensions,
    dimensions,
    menuableState,
  }
}