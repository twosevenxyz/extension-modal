<template>
  <div class="patreon-container">
    <a href="https://www.patreon.com/bePatron?u=17171070" target="_blank" data-patreon-widget-type="become-patron-button">
      <img class="responsive-img" src="https://twoseven.xyz/static/images/become-patron.png">
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  mounted () {
  }
})
</script>

<style lang="scss" scoped>
.patreon-container {
  img {
    height: 36px;
  }
}
</style>
