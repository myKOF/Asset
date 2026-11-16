'use strict';

function makeKneelOrbit(ctx, images, width, height) {
  const guideWidth=1280, guideHeight=720;
  const source=images.kneel;
  const w=source.naturalWidth, h=source.naturalHeight;
  const sx=w/guideWidth,sy=h/guideHeight;
  function layer() {
    const surface=document.createElement('canvas');
    surface.width=w;
    surface.height=h;
    return {surface,ink:surface.getContext('2d',{willReadFrequently:true})};
  }

  // Trace the approved plate in its guide coordinates, including the open spaces around the cloak.
  const silhouette=new Path2D(`
    M 0 480 Q 19 472 50 467 L 76 457 104 442 128 428 151 404
    Q 175 383 216 377 Q 237 374 254 378 L 278 383 310 383 328 375 351 358
    L 372 337 393 319 371 319 348 324 322 340 307 343 324 329 355 313 386 308
    L 407 302 427 273 451 245 433 248 420 256 409 271 400 284 401 270 417 250
    Q 383 259 366 280 L 353 301 351 292 355 276 369 258 Q 384 246 405 238
    L 445 227 462 219 486 210 510 195 528 182 535 166 550 149 569 137
    L 582 125 558 132 540 147 536 142 544 127 558 117
    L 529 120 511 128 521 116 544 104 569 97 594 93 614 84
    L 633 66 654 56 676 49 689 46 700 39 733 43 752 50 766 63
    L 779 54 790 54 802 63 811 55 823 60 836 55 848 49 834 47 860 36
    Q 878 29 894 30 Q 920 33 939 57 Q 959 80 966 107
    L 969 131 977 144 975 158 969 161 960 181 955 181 949 199 945 195
    L 933 215 926 218 919 234 924 232 916 248 914 239 910 255
    L 907 268 900 278 910 285 920 298 925 315 928 327 926 346 920 353 923 363
    L 913 376 909 390 897 408 891 425 880 445 874 467 881 479 883 501
    L 897 516 916 525 938 539 964 544 974 552 960 556
    Q 927 557 895 554 L 878 553 862 549 844 543 828 536 814 528
    L 804 511 805 491 810 477 809 462 807 451 803 440 803 412 803 398
    L 801 378 797 385 784 402 792 416 796 438 792 463 789 480 795 504
    L 801 520 803 532 815 542 836 551 860 555 875 565 887 569
    L 905 580 914 587 923 597 928 603 921 608 910 607 901 601
    L 893 601 881 595 881 606 874 615 866 616 853 607 846 608 841 615
    L 832 618 822 614 812 607 814 614 810 620 798 619 788 612
    L 778 607 765 599 747 592 743 577 739 560 744 540 741 525 732 507
    L 727 491 716 468 709 458 700 462 689 478 682 487 674 502
    L 662 516 651 518 637 536 624 540 614 537 606 552 597 549 591 565
    L 594 575 582 579 570 582 559 580 550 583 540 580 528 583 516 578
    L 506 580 499 586 486 585 469 596 444 605 448 599 432 605 416 600
    L 432 586 412 590 395 598 379 601 353 597 347 594 364 589
    L 374 581 348 584 328 579 311 571 294 571 283 561 261 557 250 546
    L 236 538 215 535 191 543 179 552 155 553 132 554 120 558 114 551
    L 117 531 122 513 115 499 98 492 80 498 63 508 71 500 48 510 33 511
    L 21 517 10 515 30 502 52 490 29 491 11 494 0 497 Z
    M 195 542 Q 210 531 222 531 L 235 529 246 540 247 548 224 551 210 549 195 549 Z
    M 642 446 L 661 442 687 433 706 434 709 445 694 451 681 462 667 464
    L 658 474 647 477 649 463 641 469 Z
    M 613 482 L 631 475 628 500 614 524 608 527 613 508 Z
    M 659 476 L 668 471 676 473 670 485 661 489 654 501 647 504 Z
    M 702 469 L 703 460 714 470 724 492 730 511 739 529 732 539 733 553
    L 733 568 722 565 705 557 679 553 664 544 675 532 683 517 691 500 Z
    M 274 422 Q 293 416 321 403 L 352 392 329 414 313 425 282 433 254 430 Z
    M 171 420 Q 203 398 231 399 L 253 397 273 390 289 396 263 408 232 413 210 410 187 420 Z
    M 382 320 L 403 316 416 313 405 325 384 329 362 339 367 332 Z
    M 430 280 L 458 263 475 262 454 271 439 281 419 299 Z
    M 500 237 L 512 227 524 212 523 220 519 228 506 238 Z
    M 399 579 L 416 571 433 570 452 572 441 577 421 578 405 585 393 586 Z
    M 554 549 L 565 548 576 532 571 549 573 560 563 563 554 559 Z
    M 532 124 L 545 115 563 111 552 118 Z
  `);

  function paintShape(ink,mode='fill') {
    ink.save();
    ink.scale(sx,sy);
    if(mode==='stroke')ink.stroke(silhouette);
    else ink.fill(silhouette,'evenodd');
    ink.restore();
  }
  const subject=layer();
  const cutoutMask=layer();
  cutoutMask.ink.filter='blur(.85px)';
  paintShape(cutoutMask.ink);
  subject.ink.drawImage(source,0,0);
  subject.ink.globalCompositeOperation='destination-in';
  subject.ink.drawImage(cutoutMask.surface,0,0);
  subject.ink.globalCompositeOperation='source-over';

  // Preserve the original exposed landscape. Supply the clean plate where the moving cutout reveals it.
  const background=layer();
  background.ink.drawImage(images.kneelDesert,0,0,w,h);
  const visibleGround=layer();
  visibleGround.ink.drawImage(source,0,0);
  const occluded=layer();
  occluded.ink.fillStyle='#fff';
  occluded.ink.strokeStyle='#fff';
  occluded.ink.lineJoin='round';
  occluded.ink.lineWidth=23;
  paintShape(occluded.ink);
  paintShape(occluded.ink,'stroke');
  occluded.ink.save();
  occluded.ink.scale(sx,sy);
  occluded.ink.beginPath();
  occluded.ink.ellipse(499,575,393,30,-.003,0,Math.PI*2);
  occluded.ink.fill();
  occluded.ink.restore();
  visibleGround.ink.globalCompositeOperation='destination-out';
  visibleGround.ink.filter='blur(10px)';
  visibleGround.ink.drawImage(occluded.surface,0,0);
  background.ink.drawImage(visibleGround.surface,0,0);

  const fabricZones=[
    // Sections along the cape, from the shoulder to the long ends touching the sand.
    {x:36,y:491,rx:79,ry:30,angle:-.24,strength:7.8,phase:.18,root:128},
    {x:122,y:450,rx:153,ry:73,strength:8.6,phase:.4,root:258},
    {x:382,y:282,rx:100,ry:60,strength:7.3,phase:1.4,root:477},
    {x:538,y:125,rx:60,ry:33,strength:5.4,phase:2.5,root:592},
    {x:683,y:60,rx:75,ry:23,angle:-.13,strength:4.9,phase:2.9,root:760},
    {x:467,y:224,rx:97,ry:27,angle:-.60,strength:6.0,phase:1.8,root:552},
    {x:345,y:420,rx:132,ry:34,angle:-.58,strength:7.8,phase:1.12,root:482},
    {x:467,y:362,rx:100,ry:23,angle:-.63,strength:5.3,phase:2.01,root:554},
    {x:487,y:564,rx:151,ry:46,strength:7.7,phase:3.6,root:625},
    {x:599,y:501,rx:31,ry:78,strength:5.6,phase:4.5,root:627},
    {x:671,y:482,rx:47,ry:53,strength:4.7,phase:5.5,root:720},
    {x:627,y:395,rx:16,ry:66,angle:.15,strength:3.6,phase:4.1},
    // The torn face opening and the small hanging threads below it.
    {x:913,y:169,rx:80,ry:23,angle:-.57,strength:2.5,phase:3.22},
    {x:916,y:236,rx:44,ry:17,angle:-1.06,strength:2.05,phase:4.31},
  ];
  const hems=new Path2D(`
    M 0 458 L 55 447 93 424 137 399 178 376 242 366 285 372 302 397
    L 271 418 234 426 182 421 149 443 124 465 109 485 65 507 0 527 Z
    M 289 346 L 365 292 345 281 386 234 480 211 540 189 498 254
    L 457 292 412 332 378 355 325 374 Z
    M 463 189 L 505 111 574 83 646 72 635 98 586 145 541 190 500 207 Z
    M 606 83 L 636 59 677 43 699 33 735 39 758 51 769 64 747 64 718 62
    L 689 66 650 80 628 90 Z
    M 300 430 L 326 406 351 376 381 343 420 319 469 302 499 286
    L 512 297 492 308 457 322 433 343 408 365 385 388 359 417 332 442
    L 308 450 282 439 Z
    M 365 436 L 393 416 430 393 466 368 494 346 526 333 547 331 549 342
    L 528 355 497 370 479 387 447 405 415 429 383 444 Z
    M 343 611 L 385 567 408 551 447 545 505 548 537 531 563 504
    L 578 455 568 414 570 389 590 365 622 379 633 445 614 482 605 535
    L 606 565 585 601 507 605 456 622 Z
    M 606 429 L 613 357 629 337 648 342 641 389 641 432 631 455 618 457 Z
    M 612 499 L 640 457 687 427 709 415 724 440 701 464 668 522 619 561 Z
    M 833 214 Q 850 179 882 161 Q 919 130 954 122 L 982 124 987 150
    L 967 159 941 161 910 177 884 195 858 220 839 231 Z
    M 883 253 L 901 230 922 199 939 185 934 218 927 242 917 264
    L 907 275 890 267 Z
  `);
  function ease(a,b,x) {
    const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
    return t*t*(3-2*t);
  }
  const cloth=makeFabricLayer(subject,w,h,sx,sy,layer,ink=>ink.fill(hems),fabricZones);

  function shade(view,x,y,radiusX,radiusY,opacity) {
    const center=view.point(x/guideWidth,y/guideHeight);
    ctx.save();
    ctx.translate(...center);
    ctx.scale(radiusX/guideWidth*width*view.zoom,radiusY/guideHeight*height*view.zoom);
    const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,'rgba(41,24,20,'+opacity+')');
    gradient.addColorStop(.57,'rgba(41,24,20,'+(opacity*.53)+')');
    gradient.addColorStop(1,'rgba(41,24,20,0)');
    ctx.fillStyle=gradient;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }

  function draw(time,imageFrame) {
    const duration=SHOT_FOUR_TIMING.riseAt-SHOT_FOUR_TIMING.kneelAt;
    const progress=ease(0,duration,time);
    const zoom=.958;
    const backgroundX=.003-.019*progress;
    const backgroundView=imageFrame(background.surface,.57,.73,zoom,backgroundX,.014);
    const [right,edgeTop]=backgroundView.point(1,0);
    const cleanEdgeWidth=Math.round(w*.008);
    // Extend clean sand into the small overscan strip beside the sword.
    ctx.drawImage(background.surface,w-cleanEdgeWidth,0,cleanEdgeWidth,h,
      right,edgeTop,width-right,height*zoom);
    const left=width*(.57*(1-zoom)+.003),top=height*(.73*(1-zoom)+.014);
    const view={zoom,point(u,v){return [left+u*width*zoom,top+v*height*zoom];}};
    shade(view,485,567,406,32,.27);
    shade(view,339,573,149,21,.34);
    shade(view,835,602,103,19,.37);
    shade(view,900,551,83,14,.24);

    cloth.draw(time);
    const [pivotX,pivotY]=view.point(783/guideWidth,589/guideHeight);
    const turn=progress*.012;
    ctx.save();
    ctx.translate(pivotX,pivotY);
    ctx.rotate(turn);
    ctx.drawImage(cloth.surface,left-pivotX,top-pivotY,width*zoom,height*zoom);
    ctx.restore();
    return {zoom,point(u,v){return view.point(u+.015*progress,v);}};
  }

  return {draw};
}
