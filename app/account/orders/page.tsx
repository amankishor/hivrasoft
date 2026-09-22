"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import Link from "next/link";

import Header from "@/components/Header/Header";
import AccountSidebar from "../components/AccountSidebar";

import {
  ChevronDown,
  Package,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
  | "Delivered"
  | "Shipped"
  | "Processing";

type FilterStatus =
  | "All Orders"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type Order = {
  id: string;
  date: string;
  title: string;
  size: string;
  qty: number;
  price: number;
  image: string;
  status: OrderStatus;
  statusText: string;
};

/* =========================================================
   DATA
========================================================= */

const orders: Order[] = [
  {
    id: "HS104328",
    date: "12 Mar 2024",
    title: "Linen Blend Kurta Set",
    size: "M",
    qty: 1,
    price: 2499,
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=500&q=85",
    status: "Delivered",
    statusText: "Delivered on 15 Mar 2024",
  },

  {
    id: "HS104125",
    date: "04 Mar 2024",
    title: "Textured Shoulder Bag",
    size: "One Size",
    qty: 1,
    price: 1799,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=85",
    status: "Shipped",
    statusText: "Arriving by 08 Mar 2024",
  },

  {
    id: "HS103892",
    date: "21 Feb 2024",
    title: "Ruffle Sleeve Top",
    size: "S",
    qty: 1,
    price: 1899,
    image:
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=500&q=85",
    status: "Processing",
    statusText: "Expected by 27 Feb 2024",
  },

  {
    id: "HS103567",
    date: "10 Feb 2024",
    title: "Floral Midi Dress",
    size: "M",
    qty: 1,
    price: 2199,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=85",
    status: "Delivered",
    statusText: "Delivered on 14 Feb 2024",
  },
];

const filters: FilterStatus[] = [
  "All Orders",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

/* =========================================================
   WINDOW WIDTH
========================================================= */

function useWindowWidth() {
  const [width, setWidth] =
    useState(1440);

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth);
    };

    updateWidth();

    window.addEventListener(
      "resize",
      updateWidth
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateWidth
      );
    };
  }, []);

  return width;
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const statusStyles: Record<
    OrderStatus,
    CSSProperties
  > = {
    Delivered: {
      color: "#2D8655",
      backgroundColor: "#E5F2E8",
    },

    Shipped: {
      color: "#4B6EBC",
      backgroundColor: "#E4EAFB",
    },

    Processing: {
      color: "#BD7E2D",
      backgroundColor: "#FFF0DA",
    },
  };

  const badgeStyle: CSSProperties = {
    width: "max-content",

    maxWidth: "100%",

    display: "flex",

    alignItems: "center",

    gap: "5px",

    padding: "5px 10px",

    borderRadius: "20px",

    fontSize: "9px",

    whiteSpace: "nowrap",

    ...statusStyles[status],
  };

  return (
    <div style={badgeStyle}>
      {status === "Delivered" && (
        <ShieldCheck size={14} />
      )}

      {status === "Shipped" && (
        <Truck size={14} />
      )}

      {status === "Processing" && (
        <RefreshCcw size={14} />
      )}

      <span>{status}</span>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function OrdersPage() {
  const width = useWindowWidth();

  const isMobile = width <= 760;

  const isSmallMobile =
    width <= 480;

  const isTablet =
    width <= 1023;

  const isCompactDesktop =
    width <= 1180;

  const isMediumDesktop =
    width <= 1350;

  /* =======================================================
     STATE
  ======================================================= */

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilterStatus>(
    "All Orders"
  );

  const [sort, setSort] =
    useState("recent");

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredOrders =
    useMemo(() => {
      let result = [...orders];

      if (
        activeFilter !==
        "All Orders"
      ) {
        if (
          activeFilter ===
          "Cancelled"
        ) {
          result = [];
        } else {
          result =
            result.filter(
              (order) =>
                order.status ===
                activeFilter
            );
        }
      }

      if (
        sort === "price-high"
      ) {
        result.sort(
          (a, b) =>
            b.price - a.price
        );
      }

      if (
        sort === "price-low"
      ) {
        result.sort(
          (a, b) =>
            a.price - b.price
        );
      }

      return result;
    }, [activeFilter, sort]);

  /* =======================================================
     TOTAL
  ======================================================= */

  const totalSpend =
    orders.reduce(
      (total, order) =>
        total + order.price,
      0
    );

  const averageOrder =
    Math.round(
      totalSpend /
        orders.length
    );

  /* =======================================================
     COUNTS
  ======================================================= */

  const getFilterCount = (
    filter: FilterStatus
  ) => {
    if (
      filter ===
      "All Orders"
    ) {
      return orders.length;
    }

    if (
      filter ===
      "Cancelled"
    ) {
      return 0;
    }

    return orders.filter(
      (order) =>
        order.status === filter
    ).length;
  };

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleAction = (
    action: string,
    order: Order
  ) => {
    if (
      action === "Buy Again"
    ) {
      window.alert(
        `${order.title} buy again`
      );

      return;
    }

    if (
      action ===
      "Track Order"
    ) {
      window.alert(
        `Tracking order #${order.id}`
      );

      return;
    }

    if (
      action ===
      "Cancel Order"
    ) {
      window.alert(
        `Cancel order #${order.id}`
      );

      return;
    }

    if (
      action === "Return"
    ) {
      window.alert(
        `Return order #${order.id}`
      );
    }
  };

  /* =======================================================
     INLINE STYLES
  ======================================================= */

  const pageWrapperStyle:
    CSSProperties = {
    width: "100%",

    minHeight:
      "calc(100vh - 105px)",

    display: "flex",

    flexDirection: "column",

    backgroundColor:
      "#FDFCFB",

    overflowX: "hidden",
  };

  const layoutStyle:
    CSSProperties = {
    width: "100%",

    maxWidth: "1600px",

    margin: "0 auto",

    flex: 1,

    minHeight: 0,

    alignItems: "start",

    ...(isTablet
      ? {
          display: "block",
        }
      : {
          display: "grid",

          gridTemplateColumns:
            "280px minmax(0, 1fr)",
        }),
  };

  const contentStyle:
    CSSProperties = {
    width: "100%",

    minWidth: 0,

    overflow: "hidden",

    boxSizing: "border-box",

    padding: isMobile
      ? "14px 12px 30px"
      : isTablet
        ? "18px 18px 35px"
        : isMediumDesktop
          ? "18px 20px 40px"
          : "20px 28px 45px",
  };

  const heroGridStyle:
    CSSProperties = {
    width: "100%",

    display: "grid",

    gridTemplateColumns:
      isCompactDesktop
        ? "1fr"
        : "minmax(0, 1.7fr) minmax(330px, 1fr)",

    gap: "18px",
  };

  const heroStyle:
    CSSProperties = {
    position: "relative",

    minWidth: 0,

    minHeight: isMobile
      ? "150px"
      : "165px",

    padding: isMobile
      ? "22px 20px"
      : "25px 30px",

    overflow: "hidden",

    borderRadius: "12px",

    boxSizing: "border-box",

    background: isMobile
      ? "#FAEDEB"
      : `
        linear-gradient(
          90deg,
          #FAEDEB 0%,
          #FAEDEB 52%,
          rgba(250, 237, 235, 0.20) 100%
        ),
        url(
          "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=85"
        )
        right center / 48% 100%
        no-repeat
      `,
  };

  const breadcrumbStyle:
    CSSProperties = {
    fontSize: "10px",

    color: "#796E69",

    letterSpacing: "0.5px",
  };

  const heroTitleStyle:
    CSSProperties = {
    margin: "14px 0 0",

    fontFamily:
      'Georgia, "Times New Roman", serif',

    fontSize: isMobile
      ? "37px"
      : "44px",

    lineHeight: 1,

    fontWeight: 400,

    color: "#292321",
  };

  const heroSubtitleStyle:
    CSSProperties = {
    margin: "12px 0 0",

    fontSize: "12px",

    color: "#6E6662",
  };

  const heroQuoteStyle:
    CSSProperties = {
    position: "absolute",

    top: "30px",

    right: "21%",

    fontFamily: "cursive",

    fontSize: "18px",

    lineHeight: 1.15,

    color: "#956967",

    transform:
      "rotate(-7deg)",

    display:
      isMediumDesktop
        ? "none"
        : "block",
  };

  const summaryStyle:
    CSSProperties = {
    minWidth: 0,

    minHeight: isMobile
      ? "auto"
      : "165px",

    padding: isMobile
      ? "16px"
      : "20px",

    boxSizing: "border-box",

    border:
      "1px solid #EEE8E5",

    borderRadius: "12px",

    backgroundColor:
      "#FFFFFF",
  };

  const summaryTopStyle:
    CSSProperties = {
    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    gap: "12px",
  };

  const summaryTitleWrapStyle:
    CSSProperties = {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: "13px",
  };

  const summaryIconStyle:
    CSSProperties = {
    width: "48px",

    height: "48px",

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

    borderRadius: "50%",

    backgroundColor:
      "#FCEAEA",

    color: "#C86D72",
  };

  const summaryTitleStyle:
    CSSProperties = {
    fontFamily:
      "Georgia, serif",

    fontSize: "17px",

    whiteSpace: "nowrap",
  };

  const viewAllStyle:
    CSSProperties = {
    flexShrink: 0,

    border: "none",

    padding: "9px 14px",

    borderRadius: "8px",

    backgroundColor:
      "#F6F2F0",

    color: "#292321",

    fontSize: "10px",

    cursor: "pointer",
  };

  const summaryStatsStyle:
    CSSProperties = {
    marginTop: "22px",

    display: "grid",

    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
  };

  const summaryStatStyle:
    CSSProperties = {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    padding: "0 8px",
  };

  const summaryValueStyle:
    CSSProperties = {
    fontFamily:
      "Georgia, serif",

    fontSize: isMobile
      ? "15px"
      : "18px",

    whiteSpace: "nowrap",

    color: "#292321",
  };

  const summaryLabelStyle:
    CSSProperties = {
    marginTop: "6px",

    fontSize: isMobile
      ? "8px"
      : "9px",

    color: "#918986",

    textAlign: "center",

    whiteSpace: isSmallMobile
      ? "normal"
      : "nowrap",
  };

  const controlsStyle:
    CSSProperties = {
    width: "100%",

    margin: "19px 0 14px",

    display: "flex",

    gap: "18px",

    ...(isMobile
      ? {
          flexDirection:
            "column",

          alignItems:
            "stretch",
        }
      : {
          alignItems:
            "center",

          justifyContent:
            "space-between",
        }),
  };

  const tabsStyle:
    CSSProperties = {
    minWidth: 0,

    width: isMobile
      ? "100%"
      : "auto",

    display: "flex",

    alignItems: "center",

    gap: "10px",

    overflowX: "auto",

    paddingBottom: "2px",
  };

  const sortWrapStyle:
    CSSProperties = {
    width: "165px",

    height: "40px",

    position: "relative",

    flexShrink: 0,

    ...(isMobile
      ? {
          alignSelf:
            "flex-end",
        }
      : {}),
  };

  const selectStyle:
    CSSProperties = {
    width: "100%",

    height: "100%",

    appearance: "none",

    outline: "none",

    border:
      "1px solid #E4DEDB",

    borderRadius: "9px",

    backgroundColor:
      "#FFFFFF",

    padding:
      "0 35px 0 13px",

    fontSize: "10px",

    color: "#292321",

    cursor: "pointer",

    boxSizing: "border-box",
  };

  const sortIconStyle:
    CSSProperties = {
    position: "absolute",

    top: "50%",

    right: "12px",

    transform:
      "translateY(-50%)",

    pointerEvents: "none",
  };

  const orderListStyle:
    CSSProperties = {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: "10px",
  };

  const getOrderCardStyle =
    (): CSSProperties => {
      if (isMobile) {
        return {
          width: "100%",

          minWidth: 0,

          display: "flex",

          flexDirection:
            "column",

          alignItems:
            "stretch",

          gap: "15px",

          padding: "16px",

          boxSizing:
            "border-box",

          border:
            "1px solid #EEE8E5",

          borderRadius:
            "11px",

          backgroundColor:
            "#FFFFFF",

          overflow: "hidden",
        };
      }

      if (
        isCompactDesktop
      ) {
        return {
          width: "100%",

          minWidth: 0,

          minHeight: "108px",

          display: "grid",

          gridTemplateColumns:
            "135px minmax(230px, 1fr) 160px",

          alignItems: "center",

          gap: "14px",

          padding:
            "13px 17px",

          boxSizing:
            "border-box",

          border:
            "1px solid #EEE8E5",

          borderRadius:
            "11px",

          backgroundColor:
            "#FFFFFF",

          overflow: "hidden",
        };
      }

      if (
        isMediumDesktop
      ) {
        return {
          width: "100%",

          minWidth: 0,

          minHeight: "108px",

          display: "grid",

          gridTemplateColumns:
            "145px minmax(220px, 1fr) 105px 145px 155px",

          alignItems: "center",

          columnGap: "11px",

          padding:
            "12px 13px",

          boxSizing:
            "border-box",

          border:
            "1px solid #EEE8E5",

          borderRadius:
            "11px",

          backgroundColor:
            "#FFFFFF",

          overflow: "hidden",
        };
      }

      return {
        width: "100%",

        minWidth: 0,

        minHeight: "108px",

        display: "grid",

        gridTemplateColumns:
          "minmax(150px, 180px) minmax(250px, 1fr) minmax(105px, 135px) minmax(150px, 175px) minmax(165px, 195px)",

        alignItems: "center",

        columnGap: "18px",

        padding:
          "13px 17px",

        boxSizing: "border-box",

        border:
          "1px solid #EEE8E5",

        borderRadius: "11px",

        backgroundColor:
          "#FFFFFF",

        overflow: "hidden",
      };
    };

  const orderInfoStyle:
    CSSProperties = {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    alignItems: "flex-start",

    ...(isMobile
      ? {
          paddingBottom:
            "12px",

          borderBottom:
            "1px solid #EEE8E5",
        }
      : {}),
  };

  const orderNumberStyle:
    CSSProperties = {
    margin: 0,

    fontSize: "11px",

    fontWeight: 700,

    whiteSpace: "nowrap",

    color: "#292321",
  };

  const orderDateStyle:
    CSSProperties = {
    marginTop: "8px",

    fontSize: "10px",

    color: "#827A76",
  };

  const detailsStyle:
    CSSProperties = {
    marginTop: "8px",

    display: "inline-flex",

    alignItems: "center",

    gap: "5px",

    color: "#D46970",

    fontSize: "10px",

    textDecoration: "none",
  };

  const productStyle:
    CSSProperties = {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: "16px",
  };

  const productImageBoxStyle:
    CSSProperties = {
    width: isMobile
      ? "90px"
      : isMediumDesktop
        ? "66px"
        : "78px",

    height: isMobile
      ? "105px"
      : isMediumDesktop
        ? "72px"
        : "78px",

    flexShrink: 0,

    overflow: "hidden",

    borderRadius: "8px",

    backgroundColor:
      "#F3ECE8",
  };

  const productImageStyle:
    CSSProperties = {
    width: "100%",

    height: "100%",

    display: "block",

    objectFit: "cover",

    objectPosition:
      "center top",
  };

  const productContentStyle:
    CSSProperties = {
    minWidth: 0,

    flex: 1,
  };

  const productTitleStyle:
    CSSProperties = {
    margin: 0,

    overflow: "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace: "nowrap",

    fontFamily:
      "Georgia, serif",

    fontSize: "14px",

    fontWeight: 400,

    color: "#292321",
  };

  const productMetaStyle:
    CSSProperties = {
    marginTop: "7px",

    display: "flex",

    alignItems: "center",

    gap: "8px",

    fontSize: "9px",

    color: "#9A928E",

    whiteSpace: "nowrap",
  };

  const productPriceStyle:
    CSSProperties = {
    display: "block",

    marginTop: "8px",

    fontFamily:
      "Georgia, serif",

    fontSize: "15px",

    color: "#292321",
  };

  const statusColumnStyle:
    CSSProperties = {
    minWidth: 0,

    display:
      isCompactDesktop &&
      !isMobile
        ? "none"
        : "flex",

    flexDirection: "column",

    alignItems: "flex-start",
  };

  const columnLabelStyle:
    CSSProperties = {
    marginBottom: "7px",

    fontSize: "8px",

    color: "#8E8581",
  };

  const paidBadgeStyle:
    CSSProperties = {
    width: "max-content",

    display: "flex",

    alignItems: "center",

    gap: "5px",

    padding: "5px 10px",

    borderRadius: "20px",

    backgroundColor:
      "#E4F4E8",

    color: "#2C8956",

    fontSize: "9px",

    whiteSpace: "nowrap",
  };

  const deliveryTextStyle:
    CSSProperties = {
    marginTop: "7px",

    maxWidth: "100%",

    overflow: "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace: "nowrap",

    fontSize: "9px",

    color: "#918986",
  };

  const cardButtonsStyle:
    CSSProperties = {
    minWidth: 0,

    ...(isMobile
      ? {
          display: "grid",

          gridTemplateColumns:
            isSmallMobile
              ? "1fr"
              : "repeat(2, minmax(0, 1fr))",

          gap: "7px",
        }
      : {
          display: "flex",

          flexDirection:
            "column",

          gap: "7px",
        }),
  };

  const primaryButtonStyle:
    CSSProperties = {
    width: "100%",

    minWidth: 0,

    minHeight: "36px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    padding: "6px 8px",

    boxSizing: "border-box",

    border:
      "1px solid #DA767E",

    borderRadius: "7px",

    backgroundColor:
      "#DA8389",

    color: "#FFFFFF",

    fontSize: "10px",

    whiteSpace: "nowrap",

    cursor: "pointer",

    textDecoration: "none",
  };

  const outlineButtonStyle:
    CSSProperties = {
    ...primaryButtonStyle,

    backgroundColor:
      "#FFFFFF",

    color: "#4E4643",
  };

  const emptyStyle:
    CSSProperties = {
    width: "100%",

    minHeight: "280px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    border:
      "1px solid #EEE7E4",

    borderRadius: "12px",

    backgroundColor:
      "#FFFFFF",

    color: "#A1807E",
  };

  const footerStyle:
    CSSProperties = {
    position: "static",

    width: "100%",

    minHeight: "72px",

    marginTop: "auto",

    borderTop:
      "1px solid #EEE8E5",

    backgroundColor:
      "#FFFFFF",

    display: isSmallMobile
      ? "none"
      : "grid",

    gridTemplateColumns:
      isMobile
        ? "repeat(2, minmax(0, 1fr))"
        : isCompactDesktop
          ? "repeat(4, minmax(0, 1fr))"
          : "repeat(5, minmax(0, 1fr))",
  };

  const benefitStyle:
    CSSProperties = {
    minWidth: 0,

    minHeight: isMobile
      ? "70px"
      : "72px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "13px",

    padding: "12px 20px",

    boxSizing: "border-box",

    borderRight:
      "1px solid #EEE8E5",
  };

  const benefitTitleStyle:
    CSSProperties = {
    display: "block",

    fontFamily:
      "Georgia, serif",

    fontSize: "10px",

    fontWeight: 400,

    color: "#292321",
  };

  const benefitTextStyle:
    CSSProperties = {
    display: "block",

    marginTop: "4px",

    fontSize: "8px",

    color: "#A19995",
  };

  const quoteBenefitStyle:
    CSSProperties = {
    display:
      isCompactDesktop
        ? "none"
        : "flex",

    alignItems: "center",

    justifyContent:
      "center",

    padding: "12px",

    fontFamily: "cursive",

    fontSize: "19px",

    color: "#765F5B",
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* HEADER COMPLETELY SEPARATE */}

      <Header />

      {/* ORDERS ONLY */}

      <div
        style={
          pageWrapperStyle
        }
      >
        <main
          style={layoutStyle}
        >
          {/* ACCOUNT SIDEBAR */}

          <AccountSidebar />

          {/* RIGHT */}

          <section
            style={contentStyle}
          >
            {/* ===============================
                HERO + SUMMARY
            =============================== */}

            <div
              style={
                heroGridStyle
              }
            >
              {/* HERO */}

              <section
                style={
                  heroStyle
                }
              >
                <div
                  style={
                    breadcrumbStyle
                  }
                >
                  MY ACCOUNT &gt;
                  Orders
                </div>

                <h1
                  style={
                    heroTitleStyle
                  }
                >
                  My Orders
                </h1>

                <p
                  style={
                    heroSubtitleStyle
                  }
                >
                  Track, manage and
                  relive your favorite
                  finds.
                </p>

                <div
                  style={
                    heroQuoteStyle
                  }
                >
                  Good
                  <br />
                  Outfits
                  <br />
                  Brighter
                  <br />
                  Days ♡
                </div>
              </section>

              {/* SUMMARY */}

              <section
                style={
                  summaryStyle
                }
              >
                <div
                  style={
                    summaryTopStyle
                  }
                >
                  <div
                    style={
                      summaryTitleWrapStyle
                    }
                  >
                    <div
                      style={
                        summaryIconStyle
                      }
                    >
                      <Package
                        size={
                          23
                        }
                        strokeWidth={
                          1.5
                        }
                      />
                    </div>

                    <span
                      style={
                        summaryTitleStyle
                      }
                    >
                      Order Summary
                    </span>
                  </div>

                  <button
                    type="button"
                    style={
                      viewAllStyle
                    }
                    onClick={() =>
                      setActiveFilter(
                        "All Orders"
                      )
                    }
                  >
                    View All
                  </button>
                </div>

                <div
                  style={
                    summaryStatsStyle
                  }
                >
                  <div
                    style={{
                      ...summaryStatStyle,

                      borderRight:
                        "1px solid #ECE7E4",
                    }}
                  >
                    <strong
                      style={
                        summaryValueStyle
                      }
                    >
                      {
                        orders.length
                      }
                    </strong>

                    <span
                      style={
                        summaryLabelStyle
                      }
                    >
                      Total Orders
                    </span>
                  </div>

                  <div
                    style={{
                      ...summaryStatStyle,

                      borderRight:
                        "1px solid #ECE7E4",
                    }}
                  >
                    <strong
                      style={
                        summaryValueStyle
                      }
                    >
                      {formatPrice(
                        totalSpend
                      )}
                    </strong>

                    <span
                      style={
                        summaryLabelStyle
                      }
                    >
                      Total Spend
                    </span>
                  </div>

                  <div
                    style={
                      summaryStatStyle
                    }
                  >
                    <strong
                      style={
                        summaryValueStyle
                      }
                    >
                      {formatPrice(
                        averageOrder
                      )}
                    </strong>

                    <span
                      style={
                        summaryLabelStyle
                      }
                    >
                      Average Order
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* ===============================
                FILTER
            =============================== */}

            <div
              style={controlsStyle}
            >
              <div
                style={tabsStyle}
              >
                {filters.map(
                  (filter) => {
                    const active =
                      activeFilter ===
                      filter;

                    return (
                      <button
                        type="button"
                        key={
                          filter
                        }
                        onClick={() =>
                          setActiveFilter(
                            filter
                          )
                        }
                        style={{
                          flexShrink: 0,

                          padding:
                            "10px 19px",

                          border:
                            "none",

                          borderRadius:
                            "30px",

                          backgroundColor:
                            active
                              ? "#F8E6E4"
                              : "#F7F3F1",

                          color:
                            active
                              ? "#713B3F"
                              : "#554D49",

                          fontSize:
                            "11px",

                          whiteSpace:
                            "nowrap",

                          cursor:
                            "pointer",
                        }}
                      >
                        {filter} (
                        {getFilterCount(
                          filter
                        )}
                        )
                      </button>
                    );
                  }
                )}
              </div>

              <div
                style={
                  sortWrapStyle
                }
              >
                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(
                      e.target
                        .value
                    )
                  }
                  style={
                    selectStyle
                  }
                >
                  <option
                    value="recent"
                  >
                    Most Recent
                  </option>

                  <option
                    value="price-high"
                  >
                    Price: High to
                    Low
                  </option>

                  <option
                    value="price-low"
                  >
                    Price: Low to
                    High
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  style={
                    sortIconStyle
                  }
                />
              </div>
            </div>

            {/* ===============================
                ORDERS
            =============================== */}

            <div
              style={
                orderListStyle
              }
            >
              {filteredOrders.length >
              0 ? (
                filteredOrders.map(
                  (order) => (
                    <article
                      key={
                        order.id
                      }
                      style={getOrderCardStyle()}
                    >
                      {/* ORDER */}

                      <div
                        style={
                          orderInfoStyle
                        }
                      >
                        <strong
                          style={
                            orderNumberStyle
                          }
                        >
                          Order #
                          {order.id}
                        </strong>

                        <span
                          style={
                            orderDateStyle
                          }
                        >
                          {
                            order.date
                          }
                        </span>

                        <Link
                          href={`/account/orders/${order.id}`}
                          style={
                            detailsStyle
                          }
                        >
                          View Details
                          <span>
                            →
                          </span>
                        </Link>
                      </div>

                      {/* PRODUCT */}

                      <div
                        style={
                          productStyle
                        }
                      >
                        <div
                          style={
                            productImageBoxStyle
                          }
                        >
                          <img
                            src={
                              order.image
                            }
                            alt={
                              order.title
                            }
                            style={
                              productImageStyle
                            }
                          />
                        </div>

                        <div
                          style={
                            productContentStyle
                          }
                        >
                          <h3
                            style={
                              productTitleStyle
                            }
                          >
                            {
                              order.title
                            }
                          </h3>

                          <div
                            style={
                              productMetaStyle
                            }
                          >
                            <span>
                              Size:{" "}
                              {
                                order.size
                              }
                            </span>

                            <span>
                              |
                            </span>

                            <span>
                              Qty:{" "}
                              {
                                order.qty
                              }
                            </span>
                          </div>

                          <strong
                            style={
                              productPriceStyle
                            }
                          >
                            {formatPrice(
                              order.price
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* PAYMENT */}

                      <div
                        style={
                          statusColumnStyle
                        }
                      >
                        <span
                          style={
                            columnLabelStyle
                          }
                        >
                          Payment
                          Status
                        </span>

                        <div
                          style={
                            paidBadgeStyle
                          }
                        >
                          <ShieldCheck
                            size={
                              14
                            }
                          />

                          Paid
                        </div>
                      </div>

                      {/* DELIVERY */}

                      <div
                        style={
                          statusColumnStyle
                        }
                      >
                        <span
                          style={
                            columnLabelStyle
                          }
                        >
                          Delivery
                          Status
                        </span>

                        <StatusBadge
                          status={
                            order.status
                          }
                        />

                        <span
                          style={
                            deliveryTextStyle
                          }
                        >
                          {
                            order.statusText
                          }
                        </span>
                      </div>

                      {/* ACTIONS */}

                      <div
                        style={
                          cardButtonsStyle
                        }
                      >
                        {order.status ===
                          "Delivered" && (
                          <>
                            <button
                              type="button"
                              style={
                                primaryButtonStyle
                              }
                              onClick={() =>
                                handleAction(
                                  "Buy Again",
                                  order
                                )
                              }
                            >
                              <ShoppingBag
                                size={
                                  14
                                }
                              />

                              Buy Again
                            </button>

                            <button
                              type="button"
                              style={
                                outlineButtonStyle
                              }
                              onClick={() =>
                                handleAction(
                                  "Return",
                                  order
                                )
                              }
                            >
                              <RotateCcw
                                size={
                                  14
                                }
                              />

                              Return
                            </button>
                          </>
                        )}

                        {order.status ===
                          "Shipped" && (
                          <>
                            <button
                              type="button"
                              style={
                                primaryButtonStyle
                              }
                              onClick={() =>
                                handleAction(
                                  "Track Order",
                                  order
                                )
                              }
                            >
                              <Truck
                                size={
                                  14
                                }
                              />

                              Track Order
                            </button>

                            <button
                              type="button"
                              style={
                                outlineButtonStyle
                              }
                              onClick={() =>
                                handleAction(
                                  "Buy Again",
                                  order
                                )
                              }
                            >
                              <ShoppingBag
                                size={
                                  14
                                }
                              />

                              Buy Again
                            </button>
                          </>
                        )}

                        {order.status ===
                          "Processing" && (
                          <>
                            <Link
                              href={`/account/orders/${order.id}`}
                              style={
                                primaryButtonStyle
                              }
                            >
                              View Details
                            </Link>

                            <button
                              type="button"
                              style={
                                outlineButtonStyle
                              }
                              onClick={() =>
                                handleAction(
                                  "Cancel Order",
                                  order
                                )
                              }
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  )
                )
              ) : (
                <div
                  style={
                    emptyStyle
                  }
                >
                  <Package
                    size={42}
                    strokeWidth={
                      1.2
                    }
                  />

                  <h3
                    style={{
                      margin:
                        "14px 0 5px",

                      fontFamily:
                        "Georgia, serif",

                      color:
                        "#4B4240",
                    }}
                  >
                    No orders found
                  </h3>

                  <p
                    style={{
                      margin: 0,

                      fontSize:
                        "11px",

                      color:
                        "#958C88",
                    }}
                  >
                    Is filter mein
                    koi order
                    available nahi
                    hai.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* ===============================
            FOOTER
        =============================== */}

        <footer
          style={footerStyle}
        >
          <div
            style={
              benefitStyle
            }
          >
            <Truck
              size={25}
              strokeWidth={1.4}
            />

            <div>
              <strong
                style={
                  benefitTitleStyle
                }
              >
                Free Shipping
              </strong>

              <span
                style={
                  benefitTextStyle
                }
              >
                on orders above
                ₹1,499
              </span>
            </div>
          </div>

          <div
            style={
              benefitStyle
            }
          >
            <RefreshCcw
              size={24}
              strokeWidth={1.4}
            />

            <div>
              <strong
                style={
                  benefitTitleStyle
                }
              >
                Easy Returns
              </strong>

              <span
                style={
                  benefitTextStyle
                }
              >
                Hassle free
                within 7 days
              </span>
            </div>
          </div>

          <div
            style={
              benefitStyle
            }
          >
            <ShieldCheck
              size={25}
              strokeWidth={1.4}
            />

            <div>
              <strong
                style={
                  benefitTitleStyle
                }
              >
                Secure Payments
              </strong>

              <span
                style={
                  benefitTextStyle
                }
              >
                Safe and trusted
              </span>
            </div>
          </div>

          <div
            style={
              benefitStyle
            }
          >
            <Sparkles
              size={24}
              strokeWidth={1.4}
            />

            <div>
              <strong
                style={
                  benefitTitleStyle
                }
              >
                Thoughtfully
                Made
              </strong>

              <span
                style={
                  benefitTextStyle
                }
              >
                For a kinder
                tomorrow
              </span>
            </div>
          </div>

          <div
            style={
              quoteBenefitStyle
            }
          >
            Style a kinder
            tomorrow ♡
          </div>
        </footer>
      </div>
    </>
  );
}