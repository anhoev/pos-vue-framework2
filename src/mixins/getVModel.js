import { computed } from '@vue/composition-api';

function getVModel(props, context) {
  let model = computed({
    get: () => props.value,
    set: value => {
      context.emit('input', value)
    }
  });

  return {
    model
  }
}

export default getVModel;
