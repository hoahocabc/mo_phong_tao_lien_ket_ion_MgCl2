// Mô phỏng liên kết ion Mg-Cl 3D
// Tác giả: GPT-5

let fontRegular; // Biến toàn cục để chứa phông chữ đã tải
let playButton, resetButton, instructionsButton;
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle"; // idle, animating, transferring, rearranging, done
let progress = 0; // Biến tiến trình chung cho chuyển động của nguyên tử (0 đến 1)
let transferProgress = 0; // Biến tiến trình cho cả hai lần chuyển electron cùng lúc
let rearrangeProgress = 0; // Biến tiến trình cho sự sắp xếp lại của cả hai lớp vỏ Cl
let transferringElectrons = []; // Mảng chứa hai electron được chuyển
let electronsReadyForTransfer = false; // Trạng thái kiểm soát khi cả hai electron sẵn sàng chuyển

// Biến cho việc xoay và di chuyển canvas
let panX = 0;
let panY = 0;

// Tham số cho khoảng cách chuyển động
let initialDistanceCl = 400; // Khoảng cách ban đầu của mỗi Cl so với Mg
// Khoảng cách cuối cùng: (bán kính vỏ Mg ngoài cùng) + 20px + (bán kính vỏ Cl ngoài cùng)
// Mg(n=3): 130px; Cl(n=3): 130px -> 130 + 20 + 130 = 280px
let finalDistanceCl = 280; 
let outermostShellRadiusCl = 50 + 2 * 40; // Bán kính lớp vỏ thứ 3 của Cl
let outermostShellRadiusMg = 50 + 2 * 40; // Bán kính lớp vỏ thứ 3 của Mg

// Các điểm điều khiển đường cong Bezier cho việc chuyển electron
let startPos1, endPos1, controlPoint1_1, controlPoint2_1;
let startPos2, endPos2, controlPoint1_2, controlPoint2_2;

function preload() {
  // Tải phông chữ để tránh lỗi trong chế độ WEBGL
  fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  // Cập nhật giá trị 'far' của perspective để giảm hiệu ứng "dẹt"
  perspective(PI / 3, width / height, 0.1, 4000); 
  
  smooth();
  textFont(fontRegular); 
  textAlign(CENTER, CENTER);
  noStroke();
  
  // Tạo UI HTML cố định
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
  
  resetSimulation();
  
  createUI();
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
    playButton.style("box-shadow", "inset 2px 2px 4px rgba(0,0,0,0.6)");
    playButton.style("transform", "scale(0.95)");
    if (state === "idle") {
      state = "animating";
    }
  });
  playButton.mouseReleased(() => {
    playButton.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    playButton.style("transform", "scale(1)");
  });
  playButton.mouseOver(() => {
    playButton.style("background", "linear-gradient(145deg, #667eea, #764ba2)");
  });
  playButton.mouseOut(() => {
    playButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });
  
  resetButton = createButton("↺ Reset");
  styleButton(resetButton);
  resetButton.mousePressed(() => {
    resetButton.style("box-shadow", "inset 2px 2px 4px rgba(0,0,0,0.6)");
    resetButton.style("transform", "scale(0.95)");
    resetSimulation();
  });
  resetButton.mouseReleased(() => {
    resetButton.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    resetButton.style("transform", "scale(1)");
  });
  resetButton.mouseOver(() => {
    resetButton.style("background", "linear-gradient(145deg, #29c6f1, #1d86f0)");
  });
  resetButton.mouseOut(() => {
    resetButton.style("background", "linear-gradient(145deg, #36d1dc, #5b86e5)");
  });

  instructionsButton = createButton("Hướng dẫn");
  styleButton(instructionsButton, true);
  instructionsButton.mousePressed(() => {
      instructionsPopup.style('display', 'block');
  });

  // Tạo popup hướng dẫn
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
  instructionsPopup.style('display', 'none'); // Ẩn mặc định

  let popupContent = `
    <h2 style="font-size: 24px; margin-bottom: 15px; text-align: center;">Hướng dẫn sử dụng</h2>
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 10px;">• Nhấn nút "Play" để bắt đầu quá trình mô phỏng liên kết ion.</li>
      <li style="margin-bottom: 10px;">• Sau khi mô phỏng hoàn tất, bạn có thể sử dụng chuột để xoay và xem mô hình từ các góc khác nhau.</li>
      <li style="margin-bottom: 10px;">• Giữ phím **Ctrl** và kéo chuột trái để di chuyển toàn bộ mô hình trên màn hình.</li>
      <li style="margin-bottom: 10px;">• Sử dụng con lăn chuột để phóng to hoặc thu nhỏ.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút "Reset" để quay lại trạng thái ban đầu.</li>
    </ul>
    <button id="closePopup" style="display: block; width: 100%; padding: 10px; margin-top: 20px; font-size: 16px; border: none; border-radius: 6px; background-color: #36d1dc; color: #fff; cursor: pointer;">Đóng</button>
  `;
  instructionsPopup.html(popupContent);

  document.getElementById('closePopup').addEventListener('click', () => {
      instructionsPopup.style('display', 'none');
  });
  
  positionButtons();
}

function styleButton(btn, isTransparent = false) {
  btn.style("width", "80px");
  btn.style("height", "30px");
  btn.style("padding", "0px");
  btn.style("font-size", "12px");
  btn.style("border-radius", "6px");
  btn.style("color", "#fff");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 0.2s ease-in-out");
  btn.style("font-family", "Arial");

  if (isTransparent) {
    btn.style("background", "rgba(0,0,0,0)");
    btn.style("border", "1px solid #fff");
    btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
  } else {
    btn.style("border", "none");
    btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
  }
}

function positionButtons() {
  playButton.position(20, 20);
  resetButton.position(20, 60);
  instructionsButton.position(20, 100);
}

function resetSimulation() {
  atoms = [];
  // Thêm hai nguyên tử Cl và một nguyên tử Mg ở giữa
  atoms.push(new Atom(-initialDistanceCl, 0, "Cl", 17, [2, 8, 7], color(0, 255, 0))); // Cl ở bên trái
  atoms.push(new Atom(0, 0, "Mg", 12, [2, 8, 2], color(0, 150, 255))); // Mg ở giữa
  atoms.push(new Atom(initialDistanceCl, 0, "Cl", 17, [2, 8, 7], color(0, 255, 0))); // Cl ở bên phải
  
  state = "idle";
  progress = 0;
  transferProgress = 0;
  rearrangeProgress = 0;
  transferringElectrons = [];
  electronsReadyForTransfer = false;
  panX = 0; 
  panY = 0;
}

function draw() {
  background(0);
  
  if (keyIsDown(17) && mouseIsPressed) { // Ctrl + left click
    panX += (mouseX - pmouseX);
    panY += (mouseY - pmouseY);
  } else {
    orbitControl(); 
  }

  translate(panX, panY);
  
  ambientLight(80);
  pointLight(255, 255, 255, 0, 0, 300);
  
  // Logic mô phỏng mới
  if (state === "animating") {
    progress += 0.005;
    if (progress > 1) {
      progress = 1;
      // Atom movement is complete. Start electron transfer.
      state = "transferring";
      transferProgress = 0;
      transferringElectrons = [atoms[1].shells[2][0], atoms[1].shells[2][1]];
    }
    
    let t_move = easeInOutQuad(progress);
    let currentDist = lerp(initialDistanceCl, finalDistanceCl, t_move);
    atoms[0].pos.x = -currentDist;
    atoms[1].pos.x = 0;
    atoms[2].pos.x = currentDist;
  }
  else if (state === "transferring") {
    if (!electronsReadyForTransfer) {
      // Giữ cho cả hai electron quay
      transferringElectrons[0].angle += 0.02;
      transferringElectrons[1].angle += 0.02;
      
      let angle1 = transferringElectrons[0].angle % TWO_PI;
      if (angle1 < 0) angle1 += TWO_PI;
      let angle2 = transferringElectrons[1].angle % TWO_PI;
      if (angle2 < 0) angle2 += TWO_PI;

      let angleTolerance = 0.05;
      // Kiểm tra xem electron 1 có ở vị trí "9 giờ" và electron 2 có ở vị trí "3 giờ" không
      if (abs(angle1 - PI) < angleTolerance && (angle2 < angleTolerance || angle2 > TWO_PI - angleTolerance)) {
        electronsReadyForTransfer = true;
        
        // Thiết lập đường chuyển cho electron 1 (sang Cl1)
        startPos1 = createVector(cos(angle1) * atoms[1].shellRadii[2], sin(angle1) * atoms[1].shellRadii[2]);
        startPos1.add(atoms[1].pos);
        endPos1 = createVector(atoms[0].pos.x + outermostShellRadiusCl, atoms[0].pos.y, atoms[0].pos.z);
        controlPoint1_1 = createVector(p5.Vector.lerp(startPos1, endPos1, 0.3).x, startPos1.y, 0);
        controlPoint2_1 = createVector(p5.Vector.lerp(startPos1, endPos1, 0.7).x, endPos1.y, 0);
        
        // Thiết lập đường chuyển cho electron 2 (sang Cl2)
        startPos2 = createVector(cos(angle2) * atoms[1].shellRadii[2], sin(angle2) * atoms[1].shellRadii[2]);
        startPos2.add(atoms[1].pos);
        endPos2 = createVector(atoms[2].pos.x - outermostShellRadiusCl, atoms[2].pos.y, atoms[2].pos.z);
        controlPoint1_2 = createVector(p5.Vector.lerp(startPos2, endPos2, 0.3).x, startPos2.y, 0);
        controlPoint2_2 = createVector(p5.Vector.lerp(startPos2, endPos2, 0.7).x, endPos2.y, 0);

        // Xóa các electron khỏi lớp vỏ Mg
        atoms[1].shells[2] = [];
      }
    } else {
      transferProgress += 0.01;
      if (transferProgress > 1) {
        transferProgress = 1;
        
        // Chuyển electron 1 vào lớp vỏ Cl1
        let v1 = p5.Vector.sub(transferringElectrons[0].pos, atoms[0].pos);
        let transferredAngle1 = atan2(v1.y, v1.x);
        transferringElectrons[0].angle = transferredAngle1;
        transferringElectrons[0].initialAngle = transferredAngle1;
        transferringElectrons[0].targetAngle = transferredAngle1;
        atoms[0].shells[2] = [];
        atoms[0].shells[2].push(transferringElectrons[0]);
        for (let i = 1; i < 8; i++) {
          atoms[0].shells[2].push({
            angle: transferredAngle1,
            col: color(0, 255, 0),
            initialAngle: transferredAngle1,
            targetAngle: transferredAngle1
          });
        }
        
        // Chuyển electron 2 vào lớp vỏ Cl2
        let v2 = p5.Vector.sub(transferringElectrons[1].pos, atoms[2].pos);
        let transferredAngle2 = atan2(v2.y, v2.x);
        transferringElectrons[1].angle = transferredAngle2;
        transferringElectrons[1].initialAngle = transferredAngle2;
        transferringElectrons[1].targetAngle = transferredAngle2;
        atoms[2].shells[2] = [];
        atoms[2].shells[2].push(transferringElectrons[1]);
        for (let i = 1; i < 8; i++) {
          atoms[2].shells[2].push({
            angle: transferredAngle2,
            col: color(0, 255, 0),
            initialAngle: transferredAngle2,
            targetAngle: transferredAngle2
          });
        }

        prepareRearrangement(atoms[0].shells[2]);
        prepareRearrangement(atoms[2].shells[2]);
        state = "rearranging";
        rearrangeProgress = 0;
      }
      
      // Di chuyển cả hai electron
      let t_transfer = easeOutCubic(transferProgress);
      
      // Electron 1
      let mid1 = createVector(
          bezierPoint(startPos1.x, controlPoint1_1.x, controlPoint2_1.x, endPos1.x, t_transfer),
          bezierPoint(startPos1.y, controlPoint1_1.y, controlPoint2_1.y, endPos1.y, t_transfer), // Sửa lỗi ở đây
          bezierPoint(startPos1.z, controlPoint1_1.z, controlPoint2_1.z, endPos1.z, t_transfer)
      );
      transferringElectrons[0].pos = mid1;
      
      // Electron 2
      let mid2 = createVector(
          bezierPoint(startPos2.x, controlPoint1_2.x, controlPoint2_2.x, endPos2.x, t_transfer),
          bezierPoint(startPos2.y, controlPoint1_2.y, controlPoint2_2.y, endPos2.y, t_transfer),
          bezierPoint(startPos2.z, controlPoint1_2.z, controlPoint2_2.z, endPos2.z, t_transfer)
      );
      transferringElectrons[1].pos = mid2;
      
      // Hiệu ứng vệt sáng và vẽ cả hai electron
      drawingContext.shadowBlur = lerp(0, 10, t_transfer);
      drawingContext.shadowColor = color(0, 150, 255);
      
      push();
      translate(mid1.x, mid1.y, 0);
      fill(transferringElectrons[0].col);
      sphere(6);
      pop();
      
      push();
      translate(mid2.x, mid2.y, 0);
      fill(transferringElectrons[1].col);
      sphere(6);
      pop();
      
      drawingContext.shadowBlur = 0;
    }
  }
  else if (state === "rearranging") {
    rearrangeProgress += 0.01;
    if (rearrangeProgress > 1) {
      rearrangeProgress = 1;
      // Kết thúc sắp xếp lại, mô phỏng hoàn tất
      state = "done";
    }
    
    // Sắp xếp lại lớp vỏ của Cl1
    let shell1 = atoms[0].shells[2];
    for (let i = 0; i < shell1.length; i++) {
      let e = shell1[i];
      let t = easeOutCubic(rearrangeProgress);
      e.angle = lerp(e.initialAngle, e.targetAngle, t);
    }
    
    // Sắp xếp lại lớp vỏ của Cl2
    let shell2 = atoms[2].shells[2];
    for (let i = 0; i < shell2.length; i++) {
      let e = shell2[i];
      let t = easeOutCubic(rearrangeProgress);
      e.angle = lerp(e.initialAngle, e.targetAngle, t);
    }
  }
  
  for (let atom of atoms) {
    push();
    translate(atom.pos.x, atom.pos.y, 0);
    atom.show();
    pop();
  }
  
  // Vẽ electron đang chuyển động nếu nó đang trong giai đoạn chờ
  if (state === "transferring" && !electronsReadyForTransfer) {
    push();
    translate(atoms[1].pos.x, atoms[1].pos.y, 0);
    // Electron 1
    let e1 = transferringElectrons[0];
    let ex1 = cos(e1.angle) * atoms[1].shellRadii[2];
    let ey1 = sin(e1.angle) * atoms[1].shellRadii[2];
    push();
    translate(ex1, ey1, 0);
    fill(e1.col);
    sphere(6);
    pop();
    push();
    fill(255, 255, 0);
    textSize(18);
    translate(ex1, ey1-15, 0); 
    text("-", 0, 0);
    pop();
    
    // Electron 2
    let e2 = transferringElectrons[1];
    let ex2 = cos(e2.angle) * atoms[1].shellRadii[2];
    let ey2 = sin(e2.angle) * atoms[1].shellRadii[2];
    push();
    translate(ex2, ey2, 0);
    fill(e2.col);
    sphere(6);
    pop();
    push();
    fill(255, 255, 0);
    textSize(18);
    translate(ex2, ey2-15, 0); 
    text("-", 0, 0);
    pop();
    
    pop();
  }
  
  // Vẽ nhãn điện tích hạt nhân
  for (let atom of atoms) {
    push();
    translate(atom.pos.x, atom.pos.y - 30, 0);
    fill(255, 255, 0);
    textSize(18);
    if (atom.label === "Mg") text("+12", 0, 0);
    else if (atom.label === "Cl") text("+17", 0, 0);
    pop();
  }
  
  // Vẽ nhãn ion
  if (state === "done" || state === "rearranging") {
    // Cl1 bên trái
    let lastRadiusCl = atoms[0].shellRadii[2]; 
    push();
    translate(atoms[0].pos.x, atoms[0].pos.y - (lastRadiusCl + 30), 0);
    fill(255, 255, 0);
    textSize(25);
    text("-", 0, 0);
    pop();
    
    // Mg ở giữa
    let lastRadiusMg = atoms[1].shellRadii[1]; 
    push();
    translate(atoms[1].pos.x, atoms[1].pos.y - (lastRadiusMg + 30), 0);
    fill(255, 255, 0);
    textSize(25);
    text("2+", 0, 0);
    pop();

    // Cl2 bên phải
    lastRadiusCl = atoms[2].shellRadii[2]; 
    push();
    translate(atoms[2].pos.x, atoms[2].pos.y - (lastRadiusCl + 30), 0);
    fill(255, 255, 0);
    textSize(25);
    text("-", 0, 0);
    pop();
  }
}

function prepareRearrangement(shell) {
  let total = shell.length;
  let spacing = TWO_PI / total;
  for (let i = 0; i < total; i++) {
    shell[i].initialAngle = shell[i].angle;
    shell[i].targetAngle = (i * spacing) - PI/8;
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
          targetAngle: (TWO_PI / shellCounts[i]) * j
        });
      }
      this.shells.push(shellElectrons);
    }
  }
  
  show() {
    push();
    fill(255, 0, 0);
    sphere(20);
    pop();
    
    for (let i = 0; i < this.shells.length; i++) {
      if (this.shells[i].length > 0) {
        noFill();
        stroke(255);
        strokeWeight(1);
        drawSmoothCircle(this.shellRadii[i]);
        noStroke();
        for (let e of this.shells[i]) {
          let angle;
          let dynamicSpeed = lerp(0.02, 0.005, progress);
          e.angle += dynamicSpeed;
          angle = e.angle;

          let ex = cos(angle) * this.shellRadii[i];
          let ey = sin(angle) * this.shellRadii[i];
          push();
          translate(ex, ey, 0);
          if (this.label === "Cl" && i === 2 && (state === "rearranging" || state === "done")) {
            drawingContext.filter = "blur(4px)";
          }
          fill(e.col);
          sphere(6);
          drawingContext.filter = "none";
          pop();
          
          push();
          fill(255, 255, 0); 
          textSize(18); 
          translate(ex, ey-15, 0);
          text("-", 0, 0);
          pop();
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI / 3, windowWidth/windowHeight, 0.1, 4000);
  positionButtons();
}
