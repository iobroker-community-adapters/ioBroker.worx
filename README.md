![Logo](admin/worx.png)

# ioBroker.worx

[![NPM version](https://img.shields.io/npm/v/iobroker.worx.svg)](https://www.npmjs.com/package/iobroker.worx)
[![Downloads](https://img.shields.io/npm/dm/iobroker.worx.svg)](https://www.npmjs.com/package/iobroker.worx)
![Number of Installations](https://iobroker.live/badges/worx-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/worx-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.worx.png?downloads=true)](https://nodei.co/npm/iobroker.worx/)

**Tests:** ![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.worx/workflows/Test%20and%20Release/badge.svg)

## Sentry

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Required

- Node 20, 22 or 24
- JS-Controller >= 6.0.11
- Admin >= 7.7.22

## Worx (Kress, Landxcape and Ferrex) adapter for ioBroker

Control via cloud and mqtt

This adapter connects IoBroker with your Landroid Kress Landxcape or Ferrex mower via Cloud.
Temperatures, mowing times, battery level and various other data are read out from the mower.
The adapter can control the mower and you can change config params like mowtimes.

## Description

🇬🇧 [Description](/docs/en/README.md)</br>
🇩🇪 [Beschreibung](/docs/de/README.md)

## Discussion und Questions

🇩🇪 [Fragen](https://forum.iobroker.net/topic/4834/adapter-worx-landroid/)

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

## Changelog

### 3.3.0 (2026-04-12)

- (copilot) Adapter requires admin >= 7.7.22 now
- (Lucky-ESA) Dependencies updated
- (Lucky-ESA) Error HTTP 405 fixed
- (Lucky-ESA) Preparation Vision Cloud Mower
- (Lucky-ESA) Sentry Error from "Vision Cloud" fixed

### 3.2.7 (2025-08-16)

- (Lucky-ESA) MQTT connection selection added
- (Lucky-ESA) Rate limit selection added in instance settings
- (Lucky-ESA) Admin 7.6.17 required

### 3.2.6 (2025-06-29)

- (Lucky-ESA) Added rate limit for API request

### 3.2.5 (2025-06-25)

- (Lucky-ESA) MQTT connection changed

### 3.2.4 (2025-06-14)

- (Lucky-ESA) TypeError native_excluded fixed

[Older changelogs can be found there](CHANGELOG_OLD.md)

## License

MIT License

Copyright (c) 2026 iobroker-community-adapters <iobroker-community-adapters@gmx.de>  
Copyright (c) 2023-2025 TA2k <tombox2020@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
