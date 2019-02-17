<template>
  <v-app id='app'>
    <v-toolbar>
      <v-toolbar-title>
        <h2>DMT Wi-Fi BOX</h2>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn flat to='/'>User</v-btn>&nbsp;
      <v-btn flat to='/rpi'>Raspberry Pi</v-btn>&nbsp;
      <v-btn flat to='/report'>Report</v-btn>&nbsp;
      <v-btn flat to='/about'>About</v-btn>
    </v-toolbar>
    <router-view></router-view>
  </v-app>
</template>
