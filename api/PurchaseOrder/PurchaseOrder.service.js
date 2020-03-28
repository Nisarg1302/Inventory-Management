const pool = require("../../Config/database");
const { Execute_Update } = require("../../Config/Db_function");
module.exports = {
  // Service to  Add new Purchase Order
  AddPurchaseOrder: (req, callBack) => {
    let Purchase_order = req.body;
    let sql = `SET @SupplierId=?;SET @CurrencyId=?;SET @DiscountRate=?; set @PurchaseOrderTotal=? ; CALL CreatePurchaseOrder(@SupplierId,@CurrencyId,@DiscountRate,@PurchaseOrderTotal,@status,@Err_msg,@purchase_ord_id,@delivery_id);select @status as status; select @Err_msg as Err_msg;select @purchase_ord_id as purchase_ord_id; select @delivery_id as delivery_id`;

    pool.query(
      sql,
      [
        Purchase_order.SupplierId,
        Purchase_order.CurrencyId,
        Purchase_order.DiscountRate,
        Purchase_order.PurchaseOrderTotal
      ],

      (error, results, _fields) => {
        if (error) {
          return callBack(error);
        }

        return callBack(null, results);
      }
    );
  },
  // Service to Add new Purchase Order Products
  AddPurchaseOrder_Products: (
    req,
    _Purchase_OrderId,
    _delivery_id,
    callBack
  ) => {
    let product_jason = req.body.products;
    var products = [];
    var Delivery_Products = [];
    for (var i = 0; i < product_jason.length; i++) {
      products.push([
        _Purchase_OrderId,
        product_jason[i].ProductId,
        product_jason[i].Price,
        product_jason[i].Quantity,
        product_jason[i].Total
      ]);

      Delivery_Products.push([
        _delivery_id,
        product_jason[i].ProductId,
        product_jason[i].Price,
        product_jason[i].Quantity,
        product_jason[i].Total
      ]);
    }

    let sql = `INSERT INTO Purchase_Order_Products (Purchase_OrderId, ProductId,Price,Quantity,Total) VALUES ? `;

    pool.query(
      sql,
      [products],

      (error, results, _fields) => {
        if (error) {
          return callBack(error);
        }

        if (results) {
          let sql =
            "INSERT INTO `IMS`.`Delivery_Order_Products`(`DeliveryId`,`ProductId`,`Price`,`Quantity`,`Total`)VALUES ?";
          Execute_Update(sql, [Delivery_Products], (err, ord_results) => {
            if (err) {
              return callBack(err);
            } else {
              return callBack(null, ord_results);
            }
          });
        }
      }
    );
  },

  // Edit Purchase Order --------------------->
  EditPurchaseOrder: (req, callBack) => {
    let Purchase_order = req.body;
    let sql = `SET @purchase_ord_id=?;SET @SupplierId=?;SET @PurchaseOrderTotal=? ; CALL EditPurchaseOrder(@purchase_ord_id,@SupplierId,@PurchaseOrderTotal,@status,@Err_msg);select @status as status; select @Err_msg as Err_msg;`;

    pool.query(
      sql,
      [
        Purchase_order.purchase_ord_id,
        Purchase_order.SupplierId,
        Purchase_order.PurchaseOrderTotal
      ],

      (error, results, _fields) => {
        if (error) {
          return callBack(error);
        }

        return callBack(null, results);
      }
    );
  },

  // Edit Purchase Order ------------------------>

  EditPurchaseOrder_Products1: (req, callBack) => {
    let product_jason = req.body.products;
    var products = [];
    var delivery_products = [];

    for (var i = 0; i < product_jason.length; i++) {
      products.push([
        product_jason[i].ProductId,
        product_jason[i].Quantity,
        product_jason[i].Total,
        product_jason[i].PurchaseOrder_ProductId
      ]);

      delivery_products.push([
        product_jason[i].ProductId,
        product_jason[i].Quantity,
        product_jason[i].Total,
        product_jason[i].PurchaseOrder_ProductId
      ]);
    }
    let sql = `Drop table if exists TempProduct ;
      CREATE TEMPORARY TABLE TempProduct(
          ProductId INT,
          Quantity INT ,
          Total double,
          PurchaseOrder_ProductId int 
      );

      Insert into TempProduct (ProductId,Quantity,Total, PurchaseOrder_ProductId) VALUES ?;

      UPDATE IMS.Purchase_Order_Products as pop inner join TempProduct as temp on pop.PurchaseOrder_ProductId= temp.PurchaseOrder_ProductId SET pop.Quantity = temp.Quantity,pop.Total=temp.Total WHERE pop.ProductId =temp.ProductId ;
       
     

      UPDATE IMS.Delivery_Order_Products as dop inner join IMS.Delivery on dop.DeliveryId=Delivery.DeliveryId inner join IMS.Purchase_orders on Delivery.Purchase_OrderId=Purchase_orders.Purchase_OrderId inner join TempProduct as temp on Purchase_orders.Purchase_OrderId= temp.PurchaseOrder_ProductId 
      SET dop.Quantity = temp.Quantity,dop.Total=temp.Total WHERE dop.ProductId =temp.ProductId ;
      
      `;

    pool.query(
      sql,
      [products, delivery_products],

      (error, results, _fields) => {
        if (error) {
          return callBack(error);
        } else {
        }

        return callBack(null, results);
      }
    );
  },

  // Cancel Purchase Order ------------------------------------------------------------>

  Cancelpurchase_Order: (req, callBack) => {
    pool.query(
      "UPDATE Purchase_orders SET Status='Cancelled' WHERE Purchase_OrderId=?;",
      [req.body.Purchase_OrderId],

      (error, results, fields) => {
        if (error) {
          return callBack(error);
        }

        console.log(results);
        return callBack(null, results);
      }
    );
  },

  // Service to get all purchase orders information
  getAllPurchaseOrders: (CompanyId, callBack) => {
    pool.query(
      "select a.Purchase_OrderId,a.SupplierId,a.Date,a.Status,b.SupplierName,b.CompanyId,Sum(c.Quantity),Sum(c.Total) as  'Total Units' from Purchase_orders as a inner join Suppliers as b on a.SupplierId=b.SupplierId inner join Purchase_Order_Products as c on c.Purchase_OrderId=a.Purchase_OrderId  where b.CompanyId=? group by c.Purchase_OrderId",

      [CompanyId],

      (error, results, fields) => {
        if (error) {
          return callBack(error);
        }

        console.log(results);
        return callBack(null, results);
      }
    );
  },

  getIncomingPurchaseOrder_report: (companyid, callBack) => {
    let sql = `select pop.Purchase_OrderId, su.SupplierName as 'Supplier',Date, 
     sum(pop.Quantity) as 'Total unit' 
    ,Purchase_order_Totat_IncTax as Total 
     from Purchase_orders as po  inner join Purchase_Order_Products as pop
    on po.Purchase_OrderId=pop.Purchase_OrderId inner join Suppliers as su
     on po.SupplierId= su.SupplierId 
     where po.Status=1 and po.Date>=DATE_SUB(now(),INTERVAL 1 MONTH) and su.CompanyId=?
     group by pop.Purchase_OrderId `;
    pool.query(sql, [companyid], (error, results, fields) => {
      if (error) {
        console.log(error);
        return callBack(error);
      }
      return callBack(null, results);
    });
  }
};
