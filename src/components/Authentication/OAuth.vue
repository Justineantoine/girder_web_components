<script>
export default {
  name: "GirderOAuth",

  props: {
    verb: { type: String, default: "Sign in" },
    providers: { type: Array, required: true },
  },

  setup(props) {
    return {
      iconMap: {
        github: { dark: true, icon: "$github" },
        google: { dark: true, icon: "$google" },
        linkedin: { dark: true, icon: "$linkedin" },
        bitbucket: { dark: false, icon: "$bitbucket" },
        box: { dark: true, icon: "$box_com" },
        globus: { dark: true, icon: "$globus" },
        microsoft: { dark: true, icon: "$microsoft" },
      },
    };
  }
};
</script>

<template>
  <v-container class="oauth-widget">
    <v-btn v-for="provider in providers" :key="provider.id" :dark="iconMap[provider.id].dark" variant="tonal" rounded
      :href="provider.url" class="ml-0 mr-3" :prepend-icon="iconMap[provider.id].icon" style="text-transform: none;">
      {{ verb }}
      with
      {{ provider.name }}
    </v-btn>
  </v-container>
</template>
