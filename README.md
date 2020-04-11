# ha-api

This project aims to provide a simple solution to operate switches and light bulbs flashed with [Tasmota](https://github.com/arendst/Tasmota) firmware.

You can operate the switches and light bulbs with a web app. This project is the back-end API. The front end is the [ha-angular](https://github.com/ronaldbuit/ha-angular) project.

The end-result looks like this:

![Screenshot ha](https://raw.githubusercontent.com/ronaldbuit/ha-api/master/screenshot/ha-screenshot.png)

## My setup

I'm using the following devices:
* [LSC Smart Connect Filament G125 Dimmable Bulb](https://templates.blakadder.com/lsc_smart_connect_filament-G125.html)
* [Sonoff T1 EU 2 Gang Switch](https://templates.blakadder.com/sonoff_T1_eu_2.html)
* [LSC Smart Connect Power Plug v2 Plug](https://templates.blakadder.com/lsc_smart_connect_power_plug_v2.html)

The server side part is running on a Raspberry Pi 3.

## Stack

The ha-api uses this software stack:
* Nodejs - to run the API
* Nginx - HTTP proxy with security to expose ha-api to the internet
* Angular - for the [ha-angular](https://github.com/ronaldbuit/ha-angular) project

## TODO

Describe:
* Dependencies
* Test
* Install
* Nginx
* Service
