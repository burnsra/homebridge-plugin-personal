# "Personal Lights, Switches, and Contact Sensors" Plugin

This code is heavily based on the work of Ed Coen's [homebridge-dummy-contact](https://github.com/ecoen66/homebridge-dummy-contact) accessory, Nick Farina's [homebridge-dummy](https://github.com/nfarina/homebridge-dummy) accessory, and that of [NorthernMan54](https://github.com/NorthernMan54/).


Example config.json:

```
    {
        "debug": false,
        "devices": [
            {
                "name": "Test Light",
                "type": "Light",
                "contact": true
            },
            {
                "name": "Test Switch",
                "type": "Switch",
                "contact": true
            }
        ],
        "platform": "PersonalHomebridgePlugin"
    }
```