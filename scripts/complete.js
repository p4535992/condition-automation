const conditionAutomationConfig = [{
    name: 'Blinded',
    data: {
        name: 'Blinding Setting',
        scope: 'world',
        type: Boolean,
        default: false,
        config: true,
        hint: "Toggles the 'blinded' effect on token vision, setting their vision ark to 1 degree when blinded.",
        onChange: (newValue) => {
            console.log(`Blinded Setting changed to ${newValue}.`)
        },
    },
},
{
    name: 'BlindStatus',
    data: {
        name: "Blind status name",
        hint: "Name of the effect to search for, default Blinded. For CUB change to Blinded",
        scope: "world",
        config: true,
        default: "Blind",
        type: String,
    }
},
{
    name: 'shadows',
    data: {
        name: 'Shadow Setting',
        scope: 'world',
        type: Boolean,
        default: false,
        config: true,
        hint: "Toggles the elevation-shadow animation effects.",
        onChange: (newValue) => {
            console.log(`Shadow Setting changed to ${newValue}.`)
        },
    }
}];

Hooks.once('init', () => {
    conditionAutomationConfig.forEach((cfg) => {
        game.settings.register('condition-automation', cfg.name, cfg.data);
    });
});

console.log("ConditionsV2.0.0 active");

Hooks.on("preCreateActiveEffect", async (actor, effects, options, someID) => {
    const blindedSetting = game.settings.get('condition-automation', 'Blinded');
    const blindStatus = game.settings.get('condition-automation', 'BlindStatus');
    let blinded = effects.label === blindStatus;
    let token = canvas.tokens.placeables.find(i => i.actor._data._id.includes(actor.data._id))
    let actorToken = game.actors.get(actor.data._id)
    if (blinded && blindedSetting) {
        token.update({ "sightAngle": 1 });
        actorToken.update({ "token.sightAngle": 1 })
    }
});

Hooks.on("preDeleteActiveEffect", async (actor, effects, options, someID) => {
    const blindedSetting = game.settings.get('condition-automation', 'Blinded');
    const blindStatus = game.settings.get('condition-automation', 'BlindStatus');
    let blinded = effects.label === blindStatus;
    let token = canvas.tokens.placeables.find(i => i.actor._data._id.includes(actor.data._id))
    let actorToken = game.actors.get(actor.data._id)
    if (blinded && blindedSetting) {
        token.update({ "sightAngle": 360 });
        actorToken.update({ "token.sightAngle": 360 })
    }
})

Hooks.on("preUpdateToken", async (scene, token, updateData, options) => {
    const shadowSetting = game.settings.get('condition-automation', 'shadows');
    let elevation = getProperty(updateData, "elevation");
    let tokenInstance = canvas.tokens.get(token._id);
    let params =
        [{
            filterType: "twist",
            filterId: "autoTwist",
            autoDestroy: true,
            padding: 10,
            radiusPercent: 600,
            angle: 0,
            animated:
            {
                angle:
                {
                    active: true,
                    animType: "syncSinOscillation",
                    loopDuration: 6000,
                    val1: -0.03 * Math.PI,
                    val2: +0.03 * Math.PI
                }
            }
        },
        {
            filterType: "bulgepinch",
            filterId: "autoBulge",
            padding: 10,
            autoDestroy: true,
            strength: 0,
            zIndex: 2,
            radiusPercent: (elevation * 5),
            animated:
            {
                strength:
                {
                    active: true,
                    animType: "syncCosOscillation",
                    loopDuration: 6000,
                    val1: 0.3,
                    val2: .35
                }
            }
        },
        {
            filterType: "shadow",
            filterId: "autoShadow",
            rotation: 35,
            autoDestroy: true,
            blur: 2,
            quality: 5,
            distance: elevation,
            alpha: 0.33,
            padding: 10,
            shadowOnly: false,
            color: 0x000000,
            animated:
            {
                blur:
                {
                    active: true,
                    loopDuration: 6000,
                    animType: "syncCosOscillation",
                    val1: 2,
                    val2: 3
                },
                distance:
                {
                    active: true,
                    loopDuration: 6000,
                    animType: "syncSinOscillation",
                    val1: 75,
                    val2: 80
                },
                alpha:
                {
                    active: true,
                    loopDuration: 6000,
                    animType: "syncSinOscillation",
                    val1: .33,
                    val2: .2
                }
            }
        }
        ];
    if (elevation === undefined || shadowSetting === false) {
        return;
    }
    let filter = (elevation > 5) ? true : false;
    console.log(params)
    await TokenMagic.deleteFiltersOnSelected("autoShadow");
    await TokenMagic.deleteFiltersOnSelected("autoTwist");
    await TokenMagic.deleteFiltersOnSelected("autoBulge");
    if (filter) {
        console.log('final test');
        await TokenMagic.addUpdateFilters(tokenInstance, params);
    }
});