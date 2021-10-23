## Computer Graphics and Interfaces - Project 1 - "Electric fields"

#### Authored by António Duarte and Manuel Pereira, respectively, number 58(?) and 57973 of MIEI.

---

# GLSL Shaders and their inputs.

Two GLSL programs were implemented for this project, 'gridProgram' and 'chargeProgram', either fully independent from the other, neither sharing buffers nor shaders.  

## Grid point program and shaders:

Tasked with drawing the two points for each position, and the line connecting them. The 
visual effect created by shifting one of the points draws the equivalent to electric field 
lines.

The vertex shader is also in charge of calculating the resulting electric force applied on each point, using the superposition principle applied to Coulomb's Law.

## - Vertex Shader

### attributes

- vec3 vPosition
  - World coordinates for a specific point.

### uniforms

- float uTableWidth
  - World width limit, used for world-coordinate transformation to clip coordinates. 
  
- float uTableHeight
  - World height limit, used for world-coordinate transformation to clip coordinates.
  
- vec3 uChargePosition(MAX_CHARGES)
  - Vector matrix containing the position of all charges, and their effective charge on the z field.

- int uChargeAmount
  - Amount of charges present in the afore-mentioned matrix (serves as loop upper bound).
  
- float uLineLength
  - Upper limit of line length, affected by a slider.
  
- float uFieldScale
  - Vector scale modifier, affected by a slider.

### varying

- vec4 fColor
  - Passes the RGBA color vector from the vertex shader to the fragment shader. Value is given by the colorize function.

## - Fragment Shader

### varying

- varying vec4 fColor
  - Receives RGBA color vector from vertex shader and applies it to gl_FragColor


## Charge point program and shaders:

Solely tasked with drawing charges.

## - Vertex Shader

- vec3 vPosition
  - World coordinates for a specific charge.

### uniforms

- float uTableWidth
  - World width limit, used for world-coordinate transformation to clip coordinates. 
  
- float uTableHeight
  - World height limit, used for world-coordinate transformation to clip coordinates.

### varying

- float fCharge
  - Passes the charge signal from the vertex shader to the fragment shader. Value is received through the z field of the world coordinates {-1; 1}.

## - Fragment Shader

Uses procedural shading to apply complex shapes to a sole draw call. Point size is set to 20.0.

Base procedural shading creates a circle from the point, and discards a horizontal central rectangle to form a "-". 
If the charge received is positive, a vertical central rectangle is also discarded as to shape out "+", and the charge is drawn green.
Otherwise, if the charge is negative, it is drawn red.

### varying

- float fCharge
  - Receives the charge signal from the vertex shader, used for procedural shading technique.

---

# Extra functionalities

- Modifying max line lenght.
  -  Changes the maximum line length. Accessed through the side panel, in the form of a slider.
- Modifying field scale.
  - Changes the scale of the electric force applied on grid points. Accessed through the side panel, in the form of a slider.
- Modifying rotational speed.
  - Changes the speed of charge rotation. Accessed through the side panel, in the form of a slider.
- Charge reset.
  - Removes all charges on the field, applied by pressing "Backspace"
- Charge rotation inversion.
  - Inverts the rotation of the charges, applied by pressing "I"
