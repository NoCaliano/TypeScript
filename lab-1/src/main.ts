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

type ElementType =
  | "leg"
  | "hypotenuse"
  | "adjacent angle"
  | "opposite angle"
  | "angle";

function triangle(
  firstValue: number = 5,
  firstType: ElementType = "leg",
  secondValue: number = 12,
  secondType: ElementType = "leg"
): string {

  const allowedTypes: ElementType[] = [
    "leg",
    "hypotenuse",
    "adjacent angle",
    "opposite angle",
    "angle"
  ];

  if (
    !allowedTypes.includes(firstType) ||
    !allowedTypes.includes(secondType)
  ) {
    console.log("Incorrect argument type. Check the instruction.");
    return "failed";
  }

  if (firstValue <= 0 || secondValue <= 0) {
    return "Values must be greater than zero.";
  }

  let leg1: number | null = null;
  let leg2: number | null = null;
  let hypotenuse: number | null = null;
  let angleA: number | null = null;
  let angleB: number | null = null;

  const degToRad = (angle: number): number =>
    angle * Math.PI / 180;

  const radToDeg = (angle: number): number =>
    angle * 180 / Math.PI;

  const setValues = (value: number, type: ElementType): void => {

    switch (type) {

      case "leg":
        if (leg1 === null) {
          leg1 = value;
        } else {
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

  if (
    (angleA !== null && angleA >= 90) ||
    (angleB !== null && angleB >= 90)
  ) {
    return "Angles must be less than 90 degrees.";
  }

  if (leg1 !== null && leg2 !== null) {

    hypotenuse = Math.hypot(leg1, leg2);

    angleA = radToDeg(Math.atan(leg1 / leg2));
    angleB = 90 - angleA;

  } else if (leg1 !== null && hypotenuse !== null) {

    if (leg1 >= hypotenuse) {
      return "Hypotenuse must be larger than leg.";
    }

    leg2 = Math.sqrt(
      hypotenuse ** 2 - leg1 ** 2
    );

    angleA = radToDeg(
      Math.asin(leg1 / hypotenuse)
    );

    angleB = 90 - angleA;

  } else if (hypotenuse !== null && angleA !== null) {

    leg1 = hypotenuse * Math.sin(
      degToRad(angleA)
    );

    leg2 = hypotenuse * Math.cos(
      degToRad(angleA)
    );

    angleB = 90 - angleA;

  } else if (leg1 !== null && angleA !== null) {

    hypotenuse = leg1 / Math.sin(
      degToRad(angleA)
    );

    leg2 = Math.sqrt(
      hypotenuse ** 2 - leg1 ** 2
    );

    angleB = 90 - angleA;

  } else {

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