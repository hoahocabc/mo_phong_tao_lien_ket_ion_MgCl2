let fontRegular;
let playButton, resetButton, instructionsButton, sphereLayerButton, labelButton, rotationButton;
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle";
let progress = 0;
let transferProgress = 0;
let rearrangeProgress = 0;
let attractingProgress = 0;
let transferringElectrons = [];
let showSphereLayer = false;
let showOrbitsAndElectrons = true;
let lastKnownState = "idle";
let showLabels = true; // Sửa: Cho nhãn Mg và Cl hiển thị từ đầu
let showIonLabels = false; // Thêm biến mới để kiểm soát nhãn ion
let electronRotationEnabled = true;

let panX = 0;
let panY = 0;

let initialDistanceCl = 400;
let finalDistanceCl = 280;
let outermostShellRadiusCl = 50 + 2 * 40;
let outermostShellRadiusMg = 50 + 2 * 40;

let startPos_e1, endPos_e1, controlPoint1_e1, controlPoint2_e1;
let startPos_e2, endPos_e2, controlPoint1_e2, controlPoint2_e2;

let initialCameraX = 0;
let initialCameraY = 0;
let initialCameraZ;

// --- NEW: constants for nucleus & labels and sphere rendering (learned from File 1)
const NUCLEUS_RADIUS = 20;
const LABEL_OFFSET_EXTRA = 1.0;
const LABEL_ROTATION_MAG = 0.09;
const ORBIT_RADIUS = 5;

function preload() {
  fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  let fov = PI/3;
  let cameraZDistance = (initialDistanceCl * 2) / (2 * tan(fov/2));
  initialCameraZ = cameraZDistance * 1.5;
  
  perspective(fov, width / height, 0.1, 4000);
  smooth();
  textFont(fontRegular);
  textAlign(CENTER, CENTER);
  noStroke();

  camera(initialCameraX, initialCameraY, initialCameraZ, initialCameraX, initialCameraY, 0, 0, 1, 0);

  titleDiv = createDiv("MÔ PHỎNG LIÊN KẾT ION GIỮA Mg và Cl");
  titleDiv.style("position", "absolute");
  titleDiv.style("top", "10px");
  titleDiv.style("width", "100%");
  titleDiv.style("text-align", "center");
  titleDiv.style("font-size", "18px");
  titleDiv.style("color", "#fff");
  titleDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
  titleDiv.style("font-family", "Arial");

  footerDiv = createDiv("© HÓA HỌC ABC");
  footerDiv.style("position", "absolute");
  footerDiv.style("bottom", "10px");
  footerDiv.style("width", "100%");
  footerDiv.style("text-align", "center");
  footerDiv.style("font-size", "16px");
  footerDiv.style("color", "#fff");
  footerDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
  footerDiv.style("font-family", "Arial");

  createUI();
  resetSimulation();
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
}

function easeOutCubic(t) {
  let t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

function createUI() {
  playButton = createButton("▶ Play");
  styleButton(playButton);
  playButton.mousePressed(() => {
    if (state === "idle") {
      state = "animating";
    }
  });

  rotationButton = createButton("Tắt quay electron");
  styleButton(rotationButton);
  rotationButton.mousePressed(() => {
    toggleRotation();
  });

  resetButton = createButton("↺ Reset");
  styleButton(resetButton);
  resetButton.mousePressed(() => {
    resetSimulation();
  });
  
  sphereLayerButton = createButton("Bật lớp cầu");
  styleButton(sphereLayerButton);
  sphereLayerButton.mousePressed(() => {
    toggleSphereLayer();
  });

  labelButton = createButton("Tắt nhãn"); // Sửa: Cập nhật văn bản nút
  styleButton(labelButton);
  labelButton.mousePressed(() => {
    toggleLabels();
  });

  instructionsButton = createButton("Hướng dẫn");
  styleButton(instructionsButton, true);
  instructionsButton.mousePressed(() => {
    instructionsPopup.style('display', 'block');
  });

  instructionsPopup = createDiv();
  instructionsPopup.id('instructions-popup');
  instructionsPopup.style('position', 'fixed');
  instructionsPopup.style('top', '50%');
  instructionsPopup.style('left', '50%');
  instructionsPopup.style('transform', 'translate(-50%, -50%)');
  instructionsPopup.style('background-color', 'rgba(0, 0, 0, 0.85)');
  instructionsPopup.style('border-radius', '12px');
  instructionsPopup.style('padding', '20px');
  instructionsPopup.style('color', '#fff');
  instructionsPopup.style('font-family', 'Arial');
  instructionsPopup.style('z-index', '1000');
  instructionsPopup.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)');
  instructionsPopup.style('display', 'none');

  let popupContent = `
    <h2 style="font-size: 24px; margin-bottom: 15px; text-align: center;">Hướng dẫn sử dụng</h2>
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 10px;">• Nhấn nút "Play" để bắt đầu quá trình mô phỏng liên kết ion.</li>
      <li style="margin-bottom: 10px;">• Sau khi mô phỏng hoàn tất, bạn có thể sử dụng chuột để xoay và xem mô hình từ các góc khác nhau.</li>
      <li style="margin-bottom: 10px;">• Giữ phím Ctrl và kéo chuột trái để di chuyển toàn bộ mô hình trên màn hình.</li>
      <li style="margin-bottom: 10px;">• Sử dụng con lăn chuột để phóng to hoặc thu nhỏ.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút "Reset" hoặc phím F4 để quay lại trạng thái ban đầu.</li>
    </ul>
    <button id="closePopup" style="display: block; width: 100%; padding: 10px; margin-top: 20px; font-size: 16px; border: none; border-radius: 6px; background-color: #36d1dc; color: #fff; cursor: pointer;">Đóng</button>
  `;
  instructionsPopup.html(popupContent);

  // Safely add the click handler (DOM might not be ready immediately)
  setTimeout(() => {
    let closeBtn = document.getElementById('closePopup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        instructionsPopup.style('display', 'none');
      });
    }
  }, 50);

  positionButtons();
}

function keyPressed() {
    if (keyCode === 115) {
      resetSimulation();
    }
}

function styleButton(btn, isTransparent = false) {
  btn.style("width", "120px");
  btn.style("height", "30px");
  btn.style("padding", "0px");
  btn.style("font-size", "12px");
  btn.style("border-radius", "6px");
  btn.style("color", "#fff");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 0.2s ease-in-out");
  btn.style("font-family", "Arial");
  btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
  
  if (isTransparent) {
    btn.style("background", "rgba(0,0,0,0)");
    btn.style("border", "1px solid #fff");
  } else {
    btn.style("border", "none");
    btn.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  }

  btn.mousePressed(() => {
    btn.style("box-shadow", "inset 2px 2px 4px rgba(0,0,0,0.6)");
    btn.style("transform", "scale(0.95)");
  });
  
  btn.mouseReleased(() => {
    btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    btn.style("transform", "scale(1)");
  });

  btn.mouseOver(() => {
    if (btn === sphereLayerButton) {
      if (showSphereLayer) {
        btn.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
      } else {
        btn.style("background-image", "linear-gradient(145deg, #36d1dc, #5b86e5)");
      }
    } else if (btn === labelButton) {
      if (showLabels) {
        btn.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
      } else {
        btn.style("background-image", "linear-gradient(145deg, #36d1dc, #5b86e5)");
      }
    } else if (btn === rotationButton) {
      if (!electronRotationEnabled) {
        btn.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
      } else {
        btn.style("background-image", "linear-gradient(145deg, #36d1dc, #5b86e5)");
      }
    } else if (isTransparent) {
      btn.style("background", "rgba(255,255,255,0.2)");
    } else {
      btn.style("background-image", "linear-gradient(145deg, #36d1dc, #5b86e5)");
    }
  });

  btn.mouseOut(() => {
    if (btn === sphereLayerButton) {
      if (showSphereLayer) {
        btn.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
      } else {
        btn.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
      }
    } else if (btn === labelButton) {
      if (showLabels) {
        btn.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
      } else {
        btn.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
      }
    } else if (btn === rotationButton) {
      if (!electronRotationEnabled) {
        btn.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
      } else {
        btn.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
      }
    } else if (isTransparent) {
      btn.style("background", "rgba(0,0,0,0)");
    } else {
      btn.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    }
  });
}

function positionButtons() {
  playButton.position(20, 20);
  rotationButton.position(20, 60);
  sphereLayerButton.position(20, 100);
  labelButton.position(20, 140);
  resetButton.position(20, 180);
  instructionsButton.position(20, 220);
}

function updateButtonStyles() {
    if (showSphereLayer) {
      sphereLayerButton.html("Tắt lớp cầu");
      sphereLayerButton.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
    } else {
      sphereLayerButton.html("Bật lớp cầu");
      sphereLayerButton.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    }

    if (showLabels) {
      labelButton.html("Tắt nhãn");
      labelButton.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
    } else {
      labelButton.html("Bật nhãn");
      labelButton.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    }
    
    if (electronRotationEnabled) {
      rotationButton.html("Tắt quay electron");
      rotationButton.style("background-image", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    } else {
      rotationButton.html("Bật quay electron");
      rotationButton.style("background-image", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
    }
}

function toggleSphereLayer() {
  showSphereLayer = !showSphereLayer;
  if (showSphereLayer) {
    showOrbitsAndElectrons = false;
    if (state === "done") {
        state = "attracting";
        attractingProgress = 0;
    }
  } else {
    showOrbitsAndElectrons = true;
    if (state === "attracting") {
      state = "done";
    }
  }
  updateButtonStyles();
}

function toggleLabels() {
  showLabels = !showLabels;
  updateButtonStyles();
}

function toggleRotation() {
  electronRotationEnabled = !electronRotationEnabled;
  updateButtonStyles();
}

function resetSimulation() {
  atoms = [];
  atoms.push(new Atom(-initialDistanceCl, 0, "Cl", 17, [2, 8, 7], color(0, 255, 0)));
  atoms.push(new Atom(0, 0, "Mg", 12, [2, 8, 2], color(0, 150, 255)));
  atoms.push(new Atom(initialDistanceCl, 0, "Cl", 17, [2, 8, 7], color(0, 255, 0)));

  state = "idle";
  progress = 0;
  transferProgress = 0;
  rearrangeProgress = 0;
  attractingProgress = 0;
  transferringElectrons = [];
  panX = 0;
  panY = 0;
  
  showSphereLayer = false;
  showOrbitsAndElectrons = true;
  lastKnownState = "idle";
  showLabels = true; // Sửa: Cho nhãn Mg và Cl hiển thị từ đầu
  showIonLabels = false; // Đặt lại trạng thái nhãn ion

  resetMatrix();
  let fov = PI/3;
  let cameraZDistance = (initialDistanceCl * 2) / (2 * tan(fov/2));
  let finalZ = cameraZDistance * 1.5;
  camera(initialCameraX, initialCameraY, finalZ, initialCameraX, initialCameraY, 0, 0, 1, 0);

  updateButtonStyles();
}

function draw() {
  background(0);

  if (keyIsDown(17) && mouseIsPressed) {
    panX += (mouseX - pmouseX);
    panY += (mouseY - pmouseY);
  } else {
    orbitControl();
  }

  translate(panX, panY);

  // Removed fixed point light as requested.
  // Use moving directional lights + ambient when sphere layer is OFF,
  // and drawSpheresLayer() handles lights when sphere layer is ON.
  if (showSphereLayer) {
    // draw the sphere overlays and lights that preserve sphere colors/highlights
    drawSpheresLayer();
  } else {
    // No fixed lights — only ambient + two moving directional lights for dynamic highlights
    ambientLight(200); // increased brightness

    // Light 1 (slower, wider orbit) - increased intensity
    let a1 = frameCount * 0.010;
    let l1x = cos(a1) * 400;
    let l1y = sin(a1) * 240;
    directionalLight(190, 190, 190, l1x, l1y, -0.3);

    // Light 2 (faster, tighter orbit) - increased intensity
    let a2 = frameCount * 0.018 + PI / 3;
    let l2x = cos(a2) * 220;
    let l2y = sin(a2) * 160;
    directionalLight(140, 140, 140, -l2x, -l2y, 0.2);
  }

  if (electronRotationEnabled) {
    for (let atom of atoms) {
      for (let shell of atom.shells) {
        for (let e of shell) {
          e.angle += 0.036;
        }
      }
    }
  }

  if (state === "animating") {
    progress += 0.009;
    if (progress > 1) {
      progress = 1;
      state = "transfer_prep";
    }
    let t_move = easeInOutQuad(progress);
    let currentDist = lerp(initialDistanceCl, finalDistanceCl, t_move);
    atoms[0].pos.x = -currentDist;
    atoms[1].pos.x = 0;
    atoms[2].pos.x = currentDist;
  }

  if (state === "transfer_prep") {
    let mgAtom = atoms[1];
    let mgElectrons = mgAtom.shells[2];

    let electronsToTransfer = mgElectrons.filter(e => abs(sin(e.angle)) < 0.1);

    if (electronsToTransfer.length === 2) {
      electronsToTransfer.sort((eA, eB) => cos(eA.angle) - cos(eB.angle));
      setupTransfer(electronsToTransfer[0], electronsToTransfer[1]);
      state = "transferring";
      transferProgress = 0;
    }
  }
  else if (state === "transferring") {
    transferProgress += 0.018;
    if (transferProgress > 1) {
      transferProgress = 1;

      let clTarget1 = transferringElectrons[0].targetCl;
      let e1 = transferringElectrons[0].electron;
      clTarget1.shells[2].push(e1);

      let clTarget2 = transferringElectrons[1].targetCl;
      let e2 = transferringElectrons[1].electron;
      clTarget2.shells[2].push(e2);

      prepareRearrangement(atoms[0].shells[2]);
      prepareRearrangement(atoms[2].shells[2]);
      state = "rearranging";
      rearrangeProgress = 0;
      transferringElectrons = [];
    }

    if (transferringElectrons.length > 0) {
      let t_transfer = easeOutCubic(transferProgress);

      let mid1 = createVector(
        bezierPoint(startPos_e1.x, controlPoint1_e1.x, controlPoint2_e1.x, endPos_e1.x, t_transfer),
        bezierPoint(startPos_e1.y, controlPoint1_e1.y, controlPoint2_e1.y, endPos_e1.y, t_transfer),
        bezierPoint(startPos_e1.z, controlPoint1_e1.z, controlPoint2_e1.z, endPos_e1.z, t_transfer)
      );

      let mid2 = createVector(
        bezierPoint(startPos_e2.x, controlPoint1_e2.x, controlPoint2_e2.x, endPos_e2.x, t_transfer),
        bezierPoint(startPos_e2.y, controlPoint1_e2.y, controlPoint2_e2.y, endPos_e2.y, t_transfer),
        bezierPoint(startPos_e2.z, controlPoint1_e2.z, controlPoint2_e2.z, endPos_e2.z, t_transfer)
      );

      drawingContext.shadowBlur = lerp(0, 10, t_transfer);
      drawingContext.shadowColor = color(0, 150, 255);

      push();
      translate(mid1.x, mid1.y, 0);
      fill(transferringElectrons[0].color);
      sphere(6);
      pop();

      push();
      translate(mid2.x, mid2.y, 0);
      fill(transferringElectrons[1].color);
      sphere(6);
      pop();

      drawingContext.shadowBlur = 0;
    }
  } else if (state === "rearranging") {
    rearrangeProgress += 0.018;
    if (rearrangeProgress > 1) {
      rearrangeProgress = 1;
      state = "done";
      showIonLabels = true; // Sửa: Bắt đầu hiển thị nhãn ion
    }

    let shell1 = atoms[0].shells[2];
    let shell2 = atoms[2].shells[2];
    for (let i = 0; i < shell1.length; i++) {
      let e = shell1[i];
      let t = easeOutCubic(rearrangeProgress);
      e.angle = lerp(e.initialAngle, e.targetAngle, t);
    }

    for (let i = 0; i < shell2.length; i++) {
      let e = shell2[i];
      let t = easeOutCubic(rearrangeProgress);
      e.angle = lerp(e.initialAngle, e.targetAngle, t);
    }
  } else if (state === "attracting") {
    attractingProgress += 0.015;
    if (attractingProgress > 1) {
      attractingProgress = 1;
      state = "done";
    }
  }
  
  // Sửa: Ống hình trụ mờ chỉ xuất hiện sau khi quá trình chuyển electron (rearranging/done/attracting)
  if (showSphereLayer && (state === "rearranging" || state === "done" || state === "attracting")) {
    drawAttractionTube(atoms[0], atoms[1]);
    drawAttractionTube(atoms[2], atoms[1]);
  }

  for (let atom of atoms) {
    push();
    translate(atom.pos.x, atom.pos.y, 0);
    atom.show();
    pop();
  }

  // --- NEW: Draw nucleus labels (+12 and +17) using 3D placement similar to File 1
  // This places the text at the nucleus center and offsets it slightly toward the viewer (z),
  // with a small yaw (rotateY) tilt to make left/right labels face the viewer nicely.
  if (showLabels) {
    let offset = ORBIT_RADIUS;

    // Left Cl (atoms[0]) — slight translate to the right so labels don't overlap visually
    if (atoms[0]) {
      push();
      translate(atoms[0].pos.x + offset, atoms[0].pos.y, NUCLEUS_RADIUS + LABEL_OFFSET_EXTRA);
      rotateY(LABEL_ROTATION_MAG);
      fill(255, 255, 0);
      textSize(25);
      text("+17", 0, 0);
      pop();
    }

    // Center Mg (atoms[1]) — no lateral offset
    if (atoms[1]) {
      push();
      translate(atoms[1].pos.x, atoms[1].pos.y, NUCLEUS_RADIUS + LABEL_OFFSET_EXTRA);
      // center Mg: no rotation to keep label upright
      fill(255, 255, 0);
      textSize(25);
      text("+12", 0, 0);
      pop();
    }

    // Right Cl (atoms[2]) — slight translate to the left and rotate the other way
    if (atoms[2]) {
      push();
      translate(atoms[2].pos.x - offset, atoms[2].pos.y, NUCLEUS_RADIUS + LABEL_OFFSET_EXTRA);
      rotateY(-LABEL_ROTATION_MAG);
      fill(255, 255, 0);
      textSize(25);
      text("+17", 0, 0);
      pop();
    }
  }

  // --- FIX: Draw atom name labels (Mg / Cl) below each atom so they are visible
  // These are separate from the nucleus charge labels (+12 / +17). Controlled by showLabels.
  if (showLabels) {
    const labelVerticalExtraDown = 10;
    for (let atom of atoms) {
      push();
      fill(255);
      textSize(25);
      let outermostRadius = atom.shellRadii[atom.shellRadii.length - 1] || 0;
      translate(atom.pos.x, atom.pos.y + outermostRadius + 20 + labelVerticalExtraDown, 0);
      text(atom.label, 0, 0);
      pop();
    }
  }

  // Sửa:  Hiển thị nhãn ion dựa trên biến showIonLabels
  if (showIonLabels) {
    let lastRadiusCl = atoms[0].shellRadii[2];
    push();
    translate(atoms[0].pos.x, atoms[0].pos.y - (lastRadiusCl + 40), 0);
    fill(255, 255, 0);
    textSize(35);
    text("-", 0, 0);
    pop();

    let lastRadiusMg = atoms[1].shellRadii[1];
    push();
    translate(atoms[1].pos.x, atoms[1].pos.y - (lastRadiusMg + 40), 0);
    fill(255, 255, 0);
    textSize(35);
    text("2+", 0, 0);
    pop();

    lastRadiusCl = atoms[2].shellRadii[2];
    push();
    translate(atoms[2].pos.x, atoms[2].pos.y - (lastRadiusCl + 40), 0);
    fill(255, 255, 0);
    textSize(35);
    text("-", 0, 0);
    pop();
  }
}

// --- NEW: function to draw sphere overlays with controlled lighting while preserving sphere color
// Modified to shrink the sphere to the current outermost non-empty shell radius so that after Mg transfers
// electrons the Mg sphere becomes smaller (matches the current outermost shell).
function drawSpheresLayer() {
  // Slightly stronger ambient for visibility (increased)
  ambientLight(120);

  // Two moving directional lights to create dynamic highlights (positions change with frameCount)
  let aA = frameCount * 0.010;
  let LAx = cos(aA) * 380;
  let LAy = sin(aA) * 240;
  directionalLight(180, 180, 180, LAx, LAy, -0.25);

  let aB = frameCount * 0.018 + PI / 4;
  let LBx = cos(aB) * 210;
  let LBy = sin(aB) * 170;
  directionalLight(120, 120, 120, -LBx, -LBy, 0.2);

  for (let atom of atoms) {
    // Find the last non-empty shell index for this atom (so sphere size follows current outermost occupied shell)
    let lastNonEmptyIndex = -1;
    for (let i = atom.shells.length - 1; i >= 0; i--) {
      if (atom.shells[i] && atom.shells[i].length > 0) {
        lastNonEmptyIndex = i;
        break;
      }
    }

    if (lastNonEmptyIndex >= 0) {
      push();
      translate(atom.pos.x, atom.pos.y, 0);
      noStroke();

      // Slightly higher shininess so highlights from moving lights are visible
      shininess(85);

      // preserve the existing color of the sphere (outermost occupied shell's electron color)
      let electronCol = atom.shells[lastNonEmptyIndex][0].col;

      const r = red(electronCol);
      const g = green(electronCol);
      const b = blue(electronCol);

      ambientMaterial(r, g, b);
      // Make specular slightly brighter than base color for clearer highlights
      specularMaterial(min(255, r + 45), min(255, g + 45), min(255, b + 45));

      // Sphere radius will follow the currently occupied outermost shell radius.
      let outermostRadius = atom.shellRadii[lastNonEmptyIndex];
      let sphereRadius = outermostRadius + 5; // little padding beyond electron orbit
      // Higher detail for smoother shading
      sphere(sphereRadius, 64, 64);
      pop();
    }
    // if there is no occupied shell, skip drawing the sphere overlay for this atom
  }
}

function drawAttractionTube(atomA, atomB) {
  let posA = atomA.pos;
  let posB = atomB.pos;

  let posMid = p5.Vector.lerp(posA, posB, 0.5);
  let direction = p5.Vector.sub(posB, posA);
  let tubeLength = direction.mag();

  push();
  translate(posMid.x, posMid.y, posMid.z);

  let angleX = atan2(direction.y, direction.z);
  let angleY = atan2(direction.x, direction.z);
  let angleZ = atan2(direction.y, direction.x);

  rotateZ(angleZ + HALF_PI);
  
  let tubeRadius = 35; // Tăng đường kính
  // Điều chỉnh tốc độ nhấp nháy xuống chậm hơn
  let speed = 1.2; // giảm từ 4.0 xuống 1.5 để nhấp nháy chậm hơn
  let phase = posMid.x > 0 ? PI / 2 : 0; // lệch pha nhỏ giữa hai ống
  let alpha = map(sin(frameCount * speed + phase), -1, 1, 40, 100);
  let tubeColor = color(255, 255, 255, alpha);

  drawingContext.filter = 'blur(20px)'; // Tăng độ mờ
  fill(tubeColor);
  noStroke();
  cylinder(tubeRadius, tubeLength, 30, 1);
  drawingContext.filter = 'none';
  pop();
}

function setupTransfer(e1, e2) {
  let mgAtom = atoms[1];
  let clLeft = atoms[0];
  let clRight = atoms[2];

  let e1Pos = createVector(cos(e1.angle) * mgAtom.shellRadii[2] + mgAtom.pos.x, sin(e1.angle) * mgAtom.shellRadii[2] + mgAtom.pos.y);
  let e2Pos = createVector(cos(e2.angle) * mgAtom.shellRadii[2] + mgAtom.pos.x, sin(e2.angle) * mgAtom.shellRadii[2] + mgAtom.pos.y);

  let targetCl1, targetCl2;
  if (dist(e1Pos.x, e1Pos.y, clLeft.pos.x, clLeft.pos.y) < dist(e1Pos.x, e1Pos.y, clRight.pos.x, clRight.pos.y)) {
    targetCl1 = clLeft;
    targetCl2 = clRight;
  } else {
    targetCl1 = clRight;
    targetCl2 = clLeft;
  }

  transferringElectrons.push({ electron: e1, targetCl: targetCl1, color: e1.col, label: "-" });
  transferringElectrons.push({ electron: e2, targetCl: targetCl2, color: e2.col, label: "-" });

  let index1 = mgAtom.shells[2].indexOf(e1);
  if (index1 > -1) mgAtom.shells[2].splice(index1, 1);

  let index2 = mgAtom.shells[2].indexOf(e2);
  if (index2 > -1) mgAtom.shells[2].splice(index2, 1);

  startPos_e1 = createVector(cos(e1.angle) * mgAtom.shellRadii[2], sin(e1.angle) * mgAtom.shellRadii[2]).add(mgAtom.pos);
  endPos_e1 = createVector(targetCl1.pos.x + (targetCl1 === clLeft ? outermostShellRadiusCl : -outermostShellRadiusCl), targetCl1.pos.y, targetCl1.pos.z);
  controlPoint1_e1 = createVector(p5.Vector.lerp(startPos_e1, endPos_e1, 0.3).x, startPos_e1.y, 0);
  controlPoint2_e1 = createVector(p5.Vector.lerp(startPos_e1, endPos_e1, 0.7).x, endPos_e1.y, 0);

  startPos_e2 = createVector(cos(e2.angle) * mgAtom.shellRadii[2], sin(e2.angle) * mgAtom.shellRadii[2]).add(mgAtom.pos);
  endPos_e2 = createVector(targetCl2.pos.x + (targetCl2 === clLeft ? outermostShellRadiusCl : -outermostShellRadiusCl), targetCl2.pos.y, targetCl2.pos.z);
  controlPoint1_e2 = createVector(p5.Vector.lerp(startPos_e2, endPos_e2, 0.3).x, startPos_e2.y, 0);
  controlPoint2_e2 = createVector(p5.Vector.lerp(startPos_e2, endPos_e2, 0.7).x, endPos_e2.y, 0);
}

function prepareRearrangement(shell) {
  let total = shell.length;
  let spacing = TWO_PI / total;
  for (let i = 0; i < total; i++) {
    shell[i].initialAngle = shell[i].angle;
    shell[i].targetAngle = (i * spacing);
  }
}

function drawSmoothCircle(radius) {
  let numPoints = 200;
  beginShape();
  for (let i = 0; i < numPoints; i++){
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    let x = radius * cos(angle);
    let y = radius * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);
}

class Atom {
  constructor(x, y, label, protons, shellCounts, electronCol) {
    this.pos = createVector(x, y, 0);
    this.label = label;
    this.protons = protons;
    this.shells = [];
    this.shellRadii = [];
    let baseR = 50;
    let increment = 40;
    for (let i = 0; i < shellCounts.length; i++) {
      let radius = baseR + i * increment;
      this.shellRadii.push(radius);
      let shellElectrons = [];
      for (let j = 0; j < shellCounts[i]; j++) {
        shellElectrons.push({
          angle: (TWO_PI / shellCounts[i]) * j,
          col: electronCol,
          initialAngle: (TWO_PI / shellCounts[i]) * j,
          targetAngle: (TWO_PI / shellCounts[i]) * j,
          pos: createVector(0,0,0)
        });
      }
      this.shells.push(shellElectrons);
    }
  }

  show() {
    // Draw nucleus (small red sphere)
    push();
    fill(255, 0, 0);
    sphere(NUCLEUS_RADIUS);
    pop();

    if (showOrbitsAndElectrons) {
      for (let i = 0; i < this.shells.length; i++) {
        if (this.shells[i].length > 0) {
          noFill();
          stroke(255);
          strokeWeight(1);
          drawSmoothCircle(this.shellRadii[i]);
          noStroke();
          for (let e of this.shells[i]) {
            let angle = e.angle;

            let ex = cos(angle) * this.shellRadii[i];
            let ey = sin(angle) * this.shellRadii[i];
            e.pos = createVector(ex, ey, 0);
            push();
            translate(ex, ey, 0);
            if (this.label === "Cl" && i === 2 && (state === "rearranging" || state === "done")) {
              drawingContext.filter = "blur(4px)";
            }
            fill(e.col);
            sphere(6);
            drawingContext.filter = "none";
            pop();
          }
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let fov = PI/3;
  let cameraZDistance = (initialDistanceCl * 2) / (2 * tan(fov/2));
  let finalZ = cameraZDistance * 1.5;
  
  camera(initialCameraX, initialCameraY, finalZ, initialCameraX, initialCameraY, 0, 0, 1, 0);
  perspective(PI / 3, windowWidth/windowHeight, 0.1, 4000);
  positionButtons();
}