const { Execute_Update, pool } = require("../../Config/database");

module.exports = {
  AddPurchaseOrder: (req, callBack) => {
    let Purchase_order = req.body;
    let sql = `SET @SupplierId=?;SET @CurrencyId=?;SET @DiscountRate=?; set @PurchaseOrderTotal=? ; CALL CreatePurchaseOrder(@SupplierId,@CurrencyId,@DiscountRate,@PurchaseOrderTotal,@status,@Err_msg,@purchase_ord_id);select @status as status; select @Err_msg as Err_msg;select @purchase_ord_id as purchase_ord_id`;

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

  AddPurchaseOrder_Products: (req, _Purchase_OrderId, callBack) => {
    let product_jason = req.body.products;
    var products = [];

    for (var i = 0; i < product_jason.length; i++)
      products.push([
        _Purchase_OrderId,
        product_jason[i].ProductId,
        product_jason[i].Price,
        product_jason[i].Quantity,
        product_jason[i].Total
      ]);

    let sql = `INSERT INTO Purchase_Order_Products (Purchase_OrderId, ProductId,Price,Quantity,Total) VALUES ? `;

    pool.query(
      sql,
      [products],

      (error, results, _fields) => {
        if (error) {
          return callBack(error);
        }

        return callBack(null, results);
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

  EditPurchaseOrder_Products: (req, callBack) => {
    let product_jason = req.body.products;
    var count = 0;

    for (var i = 0; i < product_jason.length; i++) {
      count++;

      let sql = `Update Purchase_Order_Products SET Quantity=?,Total=? WHERE PurchaseOrder_ProductId=? `;

      var product = [
        product_jason[i].Quantity,
        product_jason[i].Total,
        product_jason[i].PurchaseOrder_ProductId
      ];

      Execute_Update(sql, product, (err, results) => {
        if (err) {
          return callBack(err);
        } else {
          if (count == product_jason.length) {
            return callBack(null, results);
          }
        }
      });
    }
  }
};