"use strict";
console.log(`
  Triangle calculator
  
  Function call example:
  triangle(value1, type1, value2, type2)
  
  Available types:
  - leg
  - hypotenuse
  - adjacent angle
  - opposite angle
  - angle
  
  Angles are specified in degrees.
  `);
  
function triangle(firstValue = 5, firstType = "leg", secondValue = 12, secondType = "leg") {
    const allowedTypes = [
        "leg",
        "hypotenuse",
        "adjacent angle",
        "opposite angle",
        "angle"
    ];
    if (!allowedTypes.includes(firstType) ||
        !allowedTypes.includes(secondType)) {
        console.log("Incorrect argument type. Check the instruction.");
        return "failed";
    }
    if (firstValue <= 0 || secondValue <= 0) {
        return "Values must be greater than zero.";
    }
    let leg1 = null;
    let leg2 = null;
    let hypotenuse = null;
    let angleA = null;
    let angleB = null;
    const degToRad = (angle) => angle * Math.PI / 180;
    const radToDeg = (angle) => angle * 180 / Math.PI;
    const setValues = (value, type) => {
        switch (type) {
            case "leg":
                if (leg1 === null) {
                    leg1 = value;
                }
                else {
                    leg2 = value;
                }
                break;
            case "hypotenuse":
                hypotenuse = value;
                break;
            case "angle":
                angleA = value;
                break;
            case "adjacent angle":
                angleB = value;
                break;
            case "opposite angle":
                angleA = value;
                break;
        }
    };
    setValues(firstValue, firstType);
    setValues(secondValue, secondType);
    if ((angleA !== null && angleA >= 90) ||
        (angleB !== null && angleB >= 90)) {
        return "Angles must be less than 90 degrees.";
    }
    if (leg1 !== null && leg2 !== null) {
        hypotenuse = Math.hypot(leg1, leg2);
        angleA = radToDeg(Math.atan(leg1 / leg2));
        angleB = 90 - angleA;
    }
    else if (leg1 !== null && hypotenuse !== null) {
        if (leg1 >= hypotenuse) {
            return "Hypotenuse must be larger than leg.";
        }
        leg2 = Math.sqrt(hypotenuse ** 2 - leg1 ** 2);
        angleA = radToDeg(Math.asin(leg1 / hypotenuse));
        angleB = 90 - angleA;
    }
    else if (hypotenuse !== null && angleA !== null) {
        leg1 = hypotenuse * Math.sin(degToRad(angleA));
        leg2 = hypotenuse * Math.cos(degToRad(angleA));
        angleB = 90 - angleA;
    }
    else if (leg1 !== null && angleA !== null) {
        hypotenuse = leg1 / Math.sin(degToRad(angleA));
        leg2 = Math.sqrt(hypotenuse ** 2 - leg1 ** 2);
        angleB = 90 - angleA;
    }
    else {
        console.log("Unsupported combination of arguments.");
        return "failed";
    }
    console.log(`
  a = ${leg1?.toFixed(2)}
  b = ${leg2?.toFixed(2)}
  c = ${hypotenuse?.toFixed(2)}
  alpha = ${angleA?.toFixed(2)}
  beta = ${angleB?.toFixed(2)}
  `);
    return "success";
}
//# sourceMappingURL=main.js.map